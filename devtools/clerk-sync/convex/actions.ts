"use node";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";

const CLERK_API_URL = "https://api.clerk.com/v1";

/**
 * Fetches JSON from the Clerk API at the specified path.
 *
 * @param path - Endpoint path appended to the Clerk base URL (include query string if needed)
 * @param secretKey - Clerk secret API key sent in the `Authorization: Bearer <key>` header
 * @returns The parsed JSON response body
 * @throws Error when the HTTP response status is not OK; the error message includes the status code and response body
 */
async function fetchClerk(path: string, secretKey: string) {
  const res = await fetch(`${CLERK_API_URL}${path}`, {
    headers: {
      Authorization: `Bearer ${secretKey}`,
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Clerk API error ${res.status}: ${text}`);
  }
  return res.json();
}

export const reconcile = action({
  args: {},
  handler: async (ctx) => {
    const secretKey = process.env.CLERK_SECRET_KEY;
    if (!secretKey) {
      throw new Error("CLERK_SECRET_KEY is not defined");
    }

    console.log("🔄 Reconciling with Clerk (source of truth)...");

    // 1. Clear existing data
    console.log("Clearing existing data...");
    await ctx.runMutation(internal.sync.clearAll, {});

    // 2. Fetch all permissions from Clerk
    console.log("Fetching permissions from Clerk...");
    const permissionsData = await fetchClerk("/organization_permissions?limit=500", secretKey);
    const permissions = Array.isArray(permissionsData) ? permissionsData : permissionsData.data || [];

    console.log(`Fetched ${permissions.length} permissions`);

    // 3. Sync Permissions
    await Promise.all(permissions.map((p: any) =>
      ctx.runMutation(internal.sync.upsertPermission, {
        clerkId: p.id,
        key: p.key,
        name: p.name,
        description: p.description || undefined,
      })
    ));

    // 4. Fetch all roles from Clerk
    console.log("Fetching roles from Clerk...");
    const rolesData = await fetchClerk("/organization_roles?limit=500", secretKey);
    const roles = Array.isArray(rolesData) ? rolesData : rolesData.data || [];

    console.log(`Fetched ${roles.length} roles`);

    // 5. Sync Roles
    await Promise.all(roles.map((r: any) =>
      ctx.runMutation(internal.sync.upsertRole, {
        clerkId: r.id,
        key: r.key,
        name: r.name,
        description: r.description || undefined,
        permissionKeys: (r.permissions || []).map((p: any) => p.key),
      })
    ));

    console.log(`✅ Reconciled ${permissions.length} permissions and ${roles.length} roles`);
    return `Synced ${permissions.length} permissions and ${roles.length} roles.`;
  },
});

