import { QueryCtx } from "./_generated/server";
import { ClerkRoleKey, ClerkPermissionKey } from "../lib/clerk/orgs"

export async function getUserIdentity(ctx: QueryCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return identity;
  return identity as (typeof identity) & { org_id: string | null, org_role: ClerkRoleKey | null, org_permissions: ClerkPermissionKey[] | null }
}

/**
 * Checks if the authenticated user has the specified Clerk organization permission.
 * 
 * @param identity - The authenticated user's identity
 * @param permission - The Clerk permission key to check for
 * @returns `true` if the user has the permission, `false` otherwise
 * 
 * @remarks
 * - If the user is logged into a **personal account** (not an organization),
 *   this function will return `true` since organization permissions don't restrict personal accounts.
 * - If the user is logged into an **organization**, this checks if the permission exists
 *   in their `org_permissions` JWT claim.
 */
export function hasPermission(
  identity: Exclude<Awaited<ReturnType<typeof getUserIdentity>>, null>,
  permission: ClerkPermissionKey
): boolean {
  return hasAllPermissions(identity, permission);
}

/**
 * Checks if the authenticated user has ANY(one or more) of the specified Clerk organization permissions (OR logic).
 * 
 * @param identity - The authenticated user's identity
 * @param permissions - One or more Clerk permission keys to check for
 * @returns `true` if the user has at least one of the specified permissions, `false` otherwise
 * 
 * @remarks
 * - If the user is logged into a **personal account** (not an organization),
 *   this function will return `true` since organization permissions don't restrict personal accounts.
 * - If the user is logged into an **organization**, this checks if ANY of the specified permissions exist
 *   in their `org_permissions` JWT claim (OR logic).
 * 
 * @example
 * ```typescript
 * // User needs either write OR read permission
 * const canAccess = hasAnyPermission(identity, "org:pipelines:write", "org:pipelines:read");
 * ```
 */
export function hasAnyPermission(
  identity: Exclude<Awaited<ReturnType<typeof getUserIdentity>>, null>,
  ...permissions: ClerkPermissionKey[]
): boolean {
  // Personal accounts (not in an org) have unrestricted access
  if (!identity.org_id) {
    return true;
  }

  if (!identity.org_permissions) {
    return false;
  }

  // Organization accounts must have at least one of the specified permissions
  return permissions.some(permission => identity.org_permissions!.includes(permission));
}

/**
 * Checks if the authenticated user has ALL of the specified Clerk organization permissions (AND logic).
 * 
 * @param identity - The authenticated user's identity
 * @param permissions - One or more Clerk permission keys to check for
 * @returns `true` if the user has all of the specified permissions, `false` otherwise
 * 
 * @remarks
 * - If the user is logged into a **personal account** (not an organization),
 *   this function will return `true` since organization permissions don't restrict personal accounts.
 * - If the user is logged into an **organization**, this checks if ALL of the specified permissions exist
 *   in their `org_permissions` JWT claim (AND logic).
 * 
 * @example
 * ```typescript
 * // User needs both write AND delete permissions
 * const canModify = hasAllPermissions(identity, "org:pipelines:write", "org:pipelines:delete");
 * ```
 */
export function hasAllPermissions(
  identity: Exclude<Awaited<ReturnType<typeof getUserIdentity>>, null>,
  ...permissions: ClerkPermissionKey[]
): boolean {
  // Personal accounts (not in an org) have unrestricted access
  if (!identity.org_id) {
    return true;
  }

  if (!identity.org_permissions) {
    return false;
  }

  // Organization accounts must have all of the specified permissions
  return permissions.every(permission => identity.org_permissions!.includes(permission));
}

/**
 * Resolves the effective "tenant" ID for the current user context.
 *
 * Returns the `org_id` if the user is authenticated within an organization,
 * otherwise returns the user's `subject` (User ID).
 *
 * Use this ID for access control checks and determining ownership when creating resources.
 */
export function resolveTenantId(identity: Exclude<Awaited<ReturnType<typeof getUserIdentity>>, null>) {
  return identity.org_id ?? identity.subject;
}

export type EntityPermissionPrefix =
  | "org:crm_accounts"
  | "org:pipelines"
  | "org:opportunities"
  | "org:contacts"
  | "org:campaigns";