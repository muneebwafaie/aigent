/**
 * CRM authentication and authorization helpers using convex-helpers.
 * 
 * These custom function builders automatically authenticate users and
 * provide identity + ownerId on the context.
 */
import {
    customQuery,
    customMutation,
    customCtx,
} from "convex-helpers/server/customFunctions";
import { query, mutation } from "../_generated/server";
import { getUserIdentity, resolveTenantId, hasAnyPermission, hasAllPermissions, hasPermission } from "../auth";
import { ClerkPermissionKey } from "../../lib/clerk/orgs";

// Type for the enhanced context with auth info
export type AuthenticatedIdentity = Exclude<
    Awaited<ReturnType<typeof getUserIdentity>>,
    null
>;

/**
 * Custom query that requires authentication.
 * Adds `identity` and `tenantId` to the context.
 */
export const authedQuery = customQuery(
    query,
    customCtx(async (ctx) => {
        const identity = await getUserIdentity(ctx);
        if (!identity) {
            throw new Error("Unauthenticated");
        }
        return {
            identity,
            tenantId: resolveTenantId(identity),
        };
    })
);

/**
 * Custom mutation that requires authentication.
 * Adds `identity` and `tenantId` to the context.
 */
export const authedMutation = customMutation(
    mutation,
    customCtx(async (ctx) => {
        const identity = await getUserIdentity(ctx);
        if (!identity) {
            throw new Error("Unauthenticated");
        }
        return {
            identity,
            tenantId: resolveTenantId(identity),
        };
    })
);

/**
 * Enforces that the authenticated identity has at least one of the provided permissions.
 *
 * Personal accounts (identities without an `org_id`) bypass permission checks.
 *
 * @param identity - The authenticated user identity; if `identity.org_id` is absent, this function returns without error.
 * @param permissions - One or more Clerk permission keys to validate; the caller must have at least one.
 * @throws Error if the identity is associated with an organization and does not have any of the specified permissions.
 */
export function requireAnyPermission(
    identity: AuthenticatedIdentity,
    ...permissions: ClerkPermissionKey[]
): void {
    // Personal accounts have full access
    if (!identity.org_id) {
        return;
    }

    // Check if user has any of the permissions
    const hasPermission = hasAnyPermission(identity, ...permissions);
    if (!hasPermission) {
        throw new Error(
            `Missing required permission: ${permissions.join(" or ")}`
        );
    }
}

/**
 * Enforces that the authenticated identity has all of the specified permissions.
 *
 * Personal accounts bypass permission checks and are treated as having full access.
 *
 * @param permissions - One or more Clerk permission keys required for access
 * @throws Error if the identity is associated with an organization and does not have all specified permissions
 */
export function requireAllPermissions(
    identity: AuthenticatedIdentity,
    ...permissions: ClerkPermissionKey[]
): void {
    // Personal accounts have full access
    if (!identity.org_id) {
        return;
    }

    // Check if user has any of the permissions
    const hasPermission = hasAllPermissions(identity, ...permissions);
    if (!hasPermission) {
        throw new Error(
            `Missing required permission: ${permissions.join(" or ")}`
        );
    }
}


/**
 * Determines whether the given resource is owned by the active tenant.
 *
 * For personal accounts, the resource is considered owned when `resourceOwnerId` equals the user's subject; for organization accounts, it is owned when `resourceOwnerId` equals the organization's id.
 *
 * @param identity - The authenticated identity of the active tenant
 * @param resourceOwnerId - The id of the resource owner to validate against the active tenant
 * @returns `true` if the active tenant owns the resource, `false` otherwise
 */
export function activeTenantOwnsResource(
    identity: AuthenticatedIdentity,
    resourceOwnerId: string
): boolean {
    // Personal account: must be the owner
    if (!identity.org_id) {
        return identity.subject === resourceOwnerId;
    }

    // Org account: resource must belong to the same org
    return identity.org_id === resourceOwnerId;
}

export { hasPermission, hasAnyPermission, hasAllPermissions };

