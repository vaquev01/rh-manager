/**
 * B People — Analytics Tracking Utility
 * Plug-and-play event tracking. Replace identify/track with PostHog/Mixpanel when ready.
 */

type EventProperties = Record<string, string | number | boolean | null>;

interface AnalyticsProvider {
    identify(userId: string, traits?: EventProperties): void;
    track(event: string, properties?: EventProperties): void;
    page(name: string, properties?: EventProperties): void;
}

// Console provider (development)
const consoleProvider: AnalyticsProvider = {
    identify(userId, traits) {
        if (process.env.NODE_ENV === "development") {
            console.log("[Analytics] identify:", userId, traits);
        }
    },
    track(event, properties) {
        if (process.env.NODE_ENV === "development") {
            console.log("[Analytics] track:", event, properties);
        }
    },
    page(name, properties) {
        if (process.env.NODE_ENV === "development") {
            console.log("[Analytics] page:", name, properties);
        }
    },
};

// Active provider (swap to PostHog/Mixpanel later)
let provider: AnalyticsProvider = consoleProvider;

export function setAnalyticsProvider(p: AnalyticsProvider) {
    provider = p;
}

export const analytics = {
    identify: (userId: string, traits?: EventProperties) => provider.identify(userId, traits),
    track: (event: string, properties?: EventProperties) => provider.track(event, properties),
    page: (name: string, properties?: EventProperties) => provider.page(name, properties),
};

// Common event helpers
export const events = {
    login: (email: string, tenant: string) =>
        analytics.track("user_login", { email, tenant }),
    logout: () =>
        analytics.track("user_logout"),
    scheduleCreated: (count: number) =>
        analytics.track("schedule_created", { entries: count }),
    communicationSent: (recipients: number, hasTemplate: boolean) =>
        analytics.track("communication_sent", { recipients, hasTemplate }),
    paymentCalculated: (total: number, pixCount: number) =>
        analytics.track("payment_calculated", { total, pixCount }),
    exportGenerated: (type: string, rows: number) =>
        analytics.track("export_generated", { type, rows }),
    automationRun: (campaigns: number, recipients: number) =>
        analytics.track("automation_run", { campaigns, recipients }),
    vacancyCreated: () =>
        analytics.track("vacancy_created"),
    competencyEvaluated: (personId: string) =>
        analytics.track("competency_evaluated", { personId }),
};
