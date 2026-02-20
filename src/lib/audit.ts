/**
 * B People — Audit Log System
 * Structured audit logging ready for DB persistence.
 * Currently stores in-memory; swap to Prisma/Supabase insert when ready.
 */

export interface AuditEntry {
    id: string;
    timestamp: string;
    userId: string;
    userEmail: string;
    tenant: string;
    action: string;
    resource: string;
    resourceId?: string;
    details?: Record<string, unknown>;
    ip?: string;
}

const MAX_ENTRIES = 1000;
let auditLog: AuditEntry[] = [];

function generateId(): string {
    return `audit_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function logAudit(entry: Omit<AuditEntry, "id" | "timestamp">): AuditEntry {
    const full: AuditEntry = {
        ...entry,
        id: generateId(),
        timestamp: new Date().toISOString(),
    };

    auditLog.unshift(full);
    if (auditLog.length > MAX_ENTRIES) {
        auditLog = auditLog.slice(0, MAX_ENTRIES);
    }

    if (process.env.NODE_ENV === "development") {
        console.log(`[Audit] ${full.action} on ${full.resource}${full.resourceId ? `#${full.resourceId}` : ""} by ${full.userEmail}`);
    }

    return full;
}

export function getAuditLog(filters?: {
    userId?: string;
    tenant?: string;
    action?: string;
    resource?: string;
    since?: string;
    limit?: number;
}): AuditEntry[] {
    let results = [...auditLog];

    if (filters?.userId) results = results.filter(e => e.userId === filters.userId);
    if (filters?.tenant) results = results.filter(e => e.tenant === filters.tenant);
    if (filters?.action) results = results.filter(e => e.action === filters.action);
    if (filters?.resource) results = results.filter(e => e.resource === filters.resource);
    if (filters?.since) {
        const since = filters.since;
        results = results.filter(e => e.timestamp >= since);
    }

    return results.slice(0, filters?.limit ?? 100);
}

export function clearAuditLog() {
    auditLog = [];
}

// Common audit actions
export const AuditActions = {
    LOGIN: "AUTH_LOGIN",
    LOGOUT: "AUTH_LOGOUT",
    CREATE: "CREATE",
    UPDATE: "UPDATE",
    DELETE: "DELETE",
    EXPORT: "EXPORT",
    SEND_COMMUNICATION: "SEND_COMMUNICATION",
    RUN_AUTOMATION: "RUN_AUTOMATION",
    CLOSE_PAYMENTS: "CLOSE_PAYMENTS",
    REOPEN_PAYMENTS: "REOPEN_PAYMENTS",
    CHANGE_ROLE: "CHANGE_ROLE",
    SCHEDULE_ASSIGN: "SCHEDULE_ASSIGN",
    SCHEDULE_REMOVE: "SCHEDULE_REMOVE",
} as const;

export const AuditResources = {
    PERSON: "person",
    SCHEDULE: "schedule",
    COMMUNICATION: "communication",
    TEMPLATE: "template",
    WEBHOOK: "webhook",
    PAYMENT: "payment",
    COMPETENCY: "competency",
    VACANCY: "vacancy",
} as const;
