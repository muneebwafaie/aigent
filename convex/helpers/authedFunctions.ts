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
 * Require the user to have AT LEAST ONE of the specified permissions.
 * Personal accounts bypass permission checks (return true).
 * Throws if the user doesn't have any of the required permissions.
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
 * Require the user to have ALL of the specified permissions.
 * Personal accounts bypass permission checks (return true).
 * Throws if the user doesn't have all of the required permissions.
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
 * Check if the resource belongs to the active tenant.
 * - For Personal Accounts: checks if the user is the owner.
 * - For Organizations: checks if the resource belongs to the organization (does NOT check permissions).
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

