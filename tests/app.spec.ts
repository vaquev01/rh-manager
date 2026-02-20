import { test, expect } from "@playwright/test";

test.describe("B People — Landing & Auth Flow", () => {
    test("landing page loads and shows hero", async ({ page }) => {
        await page.goto("/landing");
        await expect(page.locator("h1")).toContainText("Gerencie sua equipe");
        await expect(page.locator("nav")).toContainText("B People");
        await expect(page.getByRole("link", { name: "Planos" })).toBeVisible();
        await expect(page.getByRole("link", { name: "Entrar" })).toBeVisible();
    });

    test("landing page has all 8 feature cards", async ({ page }) => {
        await page.goto("/landing");
        const cards = page.locator("#features .group");
        await expect(cards).toHaveCount(8);
    });

    test("landing footer has legal links", async ({ page }) => {
        await page.goto("/landing");
        await expect(page.getByRole("link", { name: "Termos de Uso" })).toBeVisible();
        await expect(page.getByRole("link", { name: "Privacidade" })).toBeVisible();
    });

    test("login page loads", async ({ page }) => {
        await page.goto("/login");
        await expect(page.locator("text=Acesse sua Central Operacional")).toBeVisible();
        await expect(page.getByPlaceholder("seu@email.com")).toBeVisible();
    });

    test("login with invalid credentials shows error", async ({ page }) => {
        await page.goto("/login");
        await page.getByPlaceholder("seu@email.com").fill("wrong@email.com");
        await page.getByPlaceholder("••••••••").fill("wrongpass");
        await page.getByRole("button", { name: "Entrar" }).click();
        await expect(page.locator("text=E-mail ou senha incorretos")).toBeVisible({ timeout: 3000 });
    });

    test("login with valid credentials redirects to dashboard", async ({ page }) => {
        await page.goto("/login");
        await page.getByPlaceholder("seu@email.com").fill("admin@wardogs.com");
        await page.getByPlaceholder("••••••••").fill("wardogs");
        await page.getByRole("button", { name: "Entrar" }).click();
        await page.waitForURL("/", { timeout: 5000 });
        await expect(page.locator("text=Central Operacional")).toBeVisible();
    });

    test("unauthenticated access redirects to landing", async ({ page }) => {
        await page.goto("/");
        await page.waitForURL(/\/landing/, { timeout: 5000 });
    });
});

test.describe("B People — Public Pages", () => {
    test("pricing page loads with 3 plans", async ({ page }) => {
        await page.goto("/pricing");
        await expect(page.locator("text=Planos para cada tamanho")).toBeVisible();
        await expect(page.locator("text=Starter")).toBeVisible();
        await expect(page.locator("text=Professional")).toBeVisible();
        await expect(page.locator("text=Enterprise")).toBeVisible();
    });

    test("terms page loads", async ({ page }) => {
        await page.goto("/terms");
        await expect(page.locator("h1")).toContainText("Termos de Uso");
    });

    test("privacy page loads", async ({ page }) => {
        await page.goto("/privacy");
        await expect(page.locator("h1")).toContainText("Política de Privacidade");
        await expect(page.locator("text=LGPD")).toBeVisible();
    });

    test("onboarding page loads with step 1", async ({ page }) => {
        await page.goto("/onboarding");
        await expect(page.locator("text=Empresa")).toBeVisible();
        await expect(page.locator("text=Passo 1/4")).toBeVisible();
    });
});

test.describe("B People — API Endpoints", () => {
    test("health check returns ok", async ({ request }) => {
        const res = await request.get("/api/health");
        expect(res.status()).toBe(200);
        const body = await res.json();
        expect(body.status).toBe("ok");
        expect(body.service).toBe("bpeople");
        expect(body.version).toBe("1.0.0");
    });

    test("login API rejects bad credentials", async ({ request }) => {
        const res = await request.post("/api/auth/login", {
            data: { email: "bad@test.com", senha: "wrong" },
        });
        expect(res.status()).toBe(401);
    });

    test("login API accepts valid credentials", async ({ request }) => {
        const res = await request.post("/api/auth/login", {
            data: { email: "admin@wardogs.com", senha: "wardogs" },
        });
        expect(res.status()).toBe(200);
        const body = await res.json();
        expect(body.success).toBe(true);
        expect(body.data.role).toBe("ADMIN");
        expect(body.data.tenant).toBe("wardogs");
    });
});

test.describe("B People — Authenticated App", () => {
    test.beforeEach(async ({ page }) => {
        // Login first
        await page.goto("/login");
        await page.getByPlaceholder("seu@email.com").fill("admin@wardogs.com");
        await page.getByPlaceholder("••••••••").fill("wardogs");
        await page.getByRole("button", { name: "Entrar" }).click();
        await page.waitForURL("/", { timeout: 5000 });
    });

    test("dashboard loads with schedule builder", async ({ page }) => {
        await expect(page.locator("text=Central Operacional")).toBeVisible();
        await expect(page.locator("text=Equipe Disponível")).toBeVisible();
    });

    test("navigation works for all pages", async ({ page }) => {
        const navItems = ["Equipe", "Comunicados", "Recrutamento", "Desenvolvimento", "Configuracoes"];
        for (const item of navItems) {
            await page.getByRole("link", { name: item }).click();
            await page.waitForTimeout(500);
        }
    });

    test("notification bell is visible", async ({ page }) => {
        await expect(page.getByLabel("Notificações")).toBeVisible();
    });

    test("logout redirects to landing", async ({ page }) => {
        await page.getByRole("button", { name: /Sair/ }).click();
        await page.waitForURL(/\/landing/, { timeout: 5000 });
    });
});
