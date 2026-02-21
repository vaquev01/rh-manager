// Sentry & PostHog Initialization Stub
// Run `npx @sentry/wizard@latest -i nextjs` later to auto-configure Sentry webpack hooks.

import * as Sentry from "@sentry/nextjs";

export function initSentry() {
    if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
        Sentry.init({
            dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
            tracesSampleRate: 1.0,
            debug: false,
        });
    }
}

// PostHog will be initialized in a client provider wrapper
import posthog from "posthog-js";

export function initPostHog() {
    if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_POSTHOG_KEY) {
        posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
            api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://app.posthog.com",
            loaded: (posthog) => {
                if (process.env.NODE_ENV === "development") posthog.debug();
            },
        });
    }
}
