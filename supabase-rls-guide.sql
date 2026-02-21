/**
 * SUPABASE ROW LEVEL SECURITY (RLS) POLICIES GUIDANCE
 * 
 * To implement true multi-tenant isolation, run these SQL commands directly in the Supabase SQL Editor.
 * Prisma does not handle RLS natively very well, so it must be done at the Postgres level.
 */

/*
-- 1. Enable RLS on all relevant tables
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "companies" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "units" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "teams" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "persons" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "schedule_entries" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "payments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "templates" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "audit_logs" ENABLE ROW LEVEL SECURITY;

-- 2. Create the Tenant Isolation Policy Function
-- This assumes you map Supabase Auth UID to your users table id, OR that you set a custom JWT claim
-- For simplicity, if queries come from a Service Role (Prisma), RLS is typically bypassed. 
-- However, if you want Prisma to respect RLS, you must set the tenant_id in the Postgres session context
-- BEFORE running the query.

-- Example Policy (Tenants Table)
-- A tenant can only read their own tenant data
CREATE POLICY "Tenant Isolation" ON "tenants"
AS PERMISSIVE FOR ALL
TO authenticated
USING (id = (SELECT "tenantId" FROM "users" WHERE id = auth.uid()));

-- Example Policy (Persons Table)
CREATE POLICY "Persons Isolation" ON "persons"
AS PERMISSIVE FOR ALL
TO authenticated
USING (
  "unitId" IN (
    SELECT id FROM "units" WHERE "companyId" IN (
      SELECT id FROM "companies" WHERE "tenantId" = (SELECT "tenantId" FROM "users" WHERE id = auth.uid())
    )
  )
);
*/
