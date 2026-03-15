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

export interface AccessibleRecord {
  ownerId: string;
  assignedUserIds?: string[];
  followerIds?: string[];
  assignerIds?: string[];
}

/**
 * Check if the user can read a given CRM record based on the 7-permission and 3-array model.
 * 
 * Access is granted if:
 * 1. Personal account owns the record.
 * 2. User has `global_read` permission.
 * 3. User has `read` permission AND is a member of `assignedUserIds`, `followerIds`, or `assignerIds`.
 */
export function canReadRecord(
  identity: Exclude<Awaited<ReturnType<typeof getUserIdentity>>, null>,
  record: AccessibleRecord,
  prefix: EntityPermissionPrefix
): boolean {
  if (!identity.org_id) return identity.subject === record.ownerId;
  if (record.ownerId !== identity.org_id) return false;

  if (hasPermission(identity, `${prefix}:global_read` as ClerkPermissionKey)) return true;

  const hasScopedRead = hasPermission(identity, `${prefix}:read` as ClerkPermissionKey);
  if (!hasScopedRead) return false;

  return (
    (record.assignedUserIds?.includes(identity.subject) || false) ||
    (record.followerIds?.includes(identity.subject) || false) ||
    (record.assignerIds?.includes(identity.subject) || false)
  );
}

/**
 * Check if the user can update a given CRM record based on the 7-permission and 3-array model.
 * 
 * Access is granted if:
 * 1. Personal account owns the record.
 * 2. User has `global_update` permission.
 * 3. User has `update` permission AND is a member of `assignedUserIds` or `assignerIds`.
 */
export function canUpdateRecord(
  identity: Exclude<Awaited<ReturnType<typeof getUserIdentity>>, null>,
  record: AccessibleRecord,
  prefix: EntityPermissionPrefix
): boolean {
  if (!identity.org_id) return identity.subject === record.ownerId;
  if (record.ownerId !== identity.org_id) return false;

  if (hasPermission(identity, `${prefix}:global_update` as ClerkPermissionKey)) return true;

  const hasScopedUpdate = hasPermission(identity, `${prefix}:update` as ClerkPermissionKey);
  if (!hasScopedUpdate) return false;

  return (
    (record.assignedUserIds?.includes(identity.subject) || false) ||
    (record.assignerIds?.includes(identity.subject) || false)
  );
}

/**
 * Check if the user can delete a given CRM record based on the 7-permission and 3-array model.
 * 
 * Access is granted if:
 * 1. Personal account owns the record.
 * 2. User has `global_delete` permission.
 * 3. User has `delete` permission AND is a member of `assignedUserIds` or `assignerIds`.
 */
export function canDeleteRecord(
  identity: Exclude<Awaited<ReturnType<typeof getUserIdentity>>, null>,
  record: AccessibleRecord,
  prefix: EntityPermissionPrefix
): boolean {
  if (!identity.org_id) return identity.subject === record.ownerId;
  if (record.ownerId !== identity.org_id) return false;

  if (hasPermission(identity, `${prefix}:global_delete` as ClerkPermissionKey)) return true;

  const hasScopedDelete = hasPermission(identity, `${prefix}:delete` as ClerkPermissionKey);
  if (!hasScopedDelete) return false;

  return (
    (record.assignedUserIds?.includes(identity.subject) || false) ||
    (record.assignerIds?.includes(identity.subject) || false)
  );
}
