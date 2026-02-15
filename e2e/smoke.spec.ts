import { expect, test } from "@playwright/test";

test.describe("Smoke", () => {
  test("Dashboard: abre/fecha modal de detalhes e mantém foco dentro", async ({ page }) => {
    await page.goto("/");

    await expect(
      page.getByRole("heading", { name: "Organograma vivo + escala do dia" })
    ).toBeVisible();

    const firstCard = page.locator(".person-card").first();
    await expect(firstCard).toBeVisible();

    const name = (await firstCard.locator("p.text-sm.font-semibold").textContent())?.trim();

    await firstCard.getByRole("button", { name: "Detalhes" }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    if (name) {
      await expect(dialog.getByRole("heading", { name })).toBeVisible();
    }

    const closeButton = dialog.getByRole("button", { name: "Fechar painel" });
    await expect(closeButton).toBeFocused();

    await page.keyboard.press("Tab");
    await expect
      .poll(() =>
        page.evaluate(() => Boolean(document.activeElement?.closest('[role="dialog"]')))
      )
      .toBe(true);

    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });

  test("Carrega todas as páginas principais", async ({ page }) => {
    await page.goto("/comunicados");
    await expect(page.getByRole("heading", { name: "Editor de comunicados" })).toBeVisible();

    await page.goto("/recrutamento");
    await expect(
      page.getByRole("heading", { name: "Vagas abertas + checklist padrão" })
    ).toBeVisible();

    await page.goto("/desenvolvimento");
    await expect(
      page.getByRole("heading", { name: "Matriz de competencias por cargo" })
    ).toBeVisible();

    await page.goto("/configuracoes");
    await expect(
      page.getByRole("heading", { name: "Multi-empresa e estrutura" })
    ).toBeVisible();
  });
});
