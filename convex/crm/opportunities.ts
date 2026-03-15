/**
 * Opportunities - CRUD operations with two-layer access control.
 * 
 * Access Control:
 * - Permission-based: Users with org:opportunities:read see all org opportunities
 * - Row-level: assignedUserIds[] get read+write, followerIds[] get read-only
 */
import { v } from "convex/values";
import { authedQuery, authedMutation, activeTenantOwnsResource, AuthenticatedIdentity } from "../helpers/authedFunctions";
import { hasAnyPermission, hasPermission, canReadRecord, canUpdateRecord, canDeleteRecord } from "../auth";
import { Doc } from "../_generated/dataModel";

// Reusable opportunity validator for return types
// stageIndex refers to the index in the campaign's stages array
const opportunityValidator = v.object({
    _id: v.id("opportunities"),
    _creationTime: v.number(),
    ownerId: v.string(),
    campaignId: v.id("campaigns"),
    contactId: v.optional(v.id("contacts")),
    accountId: v.optional(v.id("accounts")),
    title: v.string(),
    value: v.number(),
    probability: v.number(),
    expectedCloseDate: v.optional(v.number()),
    stageIndex: v.number(),
    assignedUserIds: v.array(v.string()),
    followerIds: v.array(v.string()),
    assignerIds: v.array(v.string()),
});

/**
 * Check if user can read this opportunity using the 7-permission model.
 */
function canReadOpportunity(
    identity: AuthenticatedIdentity,
    opp: Doc<"opportunities">
): boolean {
    return canReadRecord(identity, opp, "org:opportunities");
}

/**
 * Check if user can write this opportunity using the 7-permission model.
 */
function canWriteOpportunity(
    identity: AuthenticatedIdentity,
    opp: Doc<"opportunities">
): boolean {
    return canUpdateRecord(identity, opp, "org:opportunities");
}

/**
 * List all opportunities for the current tenant (access-filtered).
 * For dashboard and global opportunity views.
 */
export const list = authedQuery({
    args: {},
    returns: v.array(opportunityValidator),
    handler: async (ctx) => {
        const allOpportunities = await ctx.db
            .query("opportunities")
            .withIndex("by_ownerId", (q) => q.eq("ownerId", ctx.tenantId))
            .collect();

        // Filter by access - necessary for row-level control based on user identity
        return allOpportunities.filter((opp) =>
            canReadOpportunity(ctx.identity, opp)
        );
    },
});

/**
 * List opportunities for a campaign (access-filtered).
 * Note: We use JS filter for row-level access control as it cannot be expressed
 * via indexes (depends on user identity and array membership).
 */
export const listByCampaign = authedQuery({
    args: { campaignId: v.id("campaigns") },
    returns: v.array(opportunityValidator),
    handler: async (ctx, args) => {
        // Verify campaign access
        const campaign = await ctx.db.get(args.campaignId);
        if (!campaign || !activeTenantOwnsResource(ctx.identity, campaign.ownerId)) {
            return [];
        }

        const opportunities = await ctx.db
            .query("opportunities")
            .withIndex("by_campaignId", (q) => q.eq("campaignId", args.campaignId))
            .collect();

        // Filter by access - necessary for row-level control based on user identity
        return opportunities.filter((opp) =>
            canReadOpportunity(ctx.identity, opp)
        );
    },
});

/**
 * Get a single opportunity by ID.
 */
export const get = authedQuery({
    args: { id: v.id("opportunities") },
    returns: v.union(opportunityValidator, v.null()),
    handler: async (ctx, args) => {
        const opp = await ctx.db.get(args.id);
        if (!opp) return null;

        if (!canReadOpportunity(ctx.identity, opp)) {
            return null;
        }

        return opp;
    },
});

/**
 * Create a new opportunity.
 */
export const create = authedMutation({
    args: {
        campaignId: v.id("campaigns"),
        title: v.string(),
        value: v.number(),
        probability: v.number(),
        stageIndex: v.number(),
        contactId: v.optional(v.id("contacts")),
        accountId: v.optional(v.id("accounts")),
        expectedCloseDate: v.optional(v.number()),
        assignedUserIds: v.optional(v.array(v.string())),
        followerIds: v.optional(v.array(v.string())),
        assignerIds: v.optional(v.array(v.string())),
    },
    returns: v.id("opportunities"),
    handler: async (ctx, args) => {
        // Verify campaign access
        const campaign = await ctx.db.get(args.campaignId);
        if (!campaign || !activeTenantOwnsResource(ctx.identity, campaign.ownerId)) {
            throw new Error("Campaign not found or access denied");
        }

        // Need campaigns:write (global_create or global_update) or scoped create to create opportunities
        const canCreateGlobally = hasAnyPermission(ctx.identity, "org:opportunities:global_create", "org:opportunities:global_update");

        if (ctx.identity.org_id && !canCreateGlobally) {
            throw new Error("Missing permission to create opportunities");
        }

        // Verify stage index is valid
        if (args.stageIndex < 0 || args.stageIndex >= campaign.stages.length) {
            throw new Error(`Invalid stage index: ${args.stageIndex}`);
        }

        const assigned = args.assignedUserIds ?? [ctx.identity.subject];
        const assigners = args.assignerIds ?? [ctx.identity.subject];

        return await ctx.db.insert("opportunities", {
            ownerId: ctx.tenantId,
            campaignId: args.campaignId,
            title: args.title,
            value: args.value,
            probability: args.probability,
            stageIndex: args.stageIndex,
            contactId: args.contactId,
            accountId: args.accountId,
            expectedCloseDate: args.expectedCloseDate,
            assignedUserIds: assigned,
            followerIds: args.followerIds ?? [],
            assignerIds: assigners,
        });
    },
});

/**
 * Update an opportunity.
 */
export const update = authedMutation({
    args: {
        id: v.id("opportunities"),
        title: v.optional(v.string()),
        value: v.optional(v.number()),
        probability: v.optional(v.number()),
        stageIndex: v.optional(v.number()),
        contactId: v.optional(v.id("contacts")),
        accountId: v.optional(v.id("accounts")),
        campaignId: v.optional(v.id("campaigns")),
        expectedCloseDate: v.optional(v.number()),
    },
    returns: v.null(),
    handler: async (ctx, args) => {
        const opp = await ctx.db.get(args.id);
        if (!opp) {
            throw new Error("Opportunity not found");
        }

        if (!canWriteOpportunity(ctx.identity, opp)) {
            throw new Error("Access denied");
        }

        // Verify new stage index if changing
        if (args.stageIndex !== undefined) {
            const campaign = await ctx.db.get(opp.campaignId);
            if (!campaign || args.stageIndex < 0 || args.stageIndex >= campaign.stages.length) {
                throw new Error(`Invalid stage index: ${args.stageIndex}`);
            }
        }

        const { id, ...updates } = args;
        const filteredUpdates = Object.fromEntries(
            Object.entries(updates).filter(([_, v]) => v !== undefined)
        );

        await ctx.db.patch(args.id, filteredUpdates);
        return null;
    },
});

/**
 * Move opportunity to a different stage.
 */
export const moveStage = authedMutation({
    args: {
        id: v.id("opportunities"),
        stageIndex: v.number(),
    },
    returns: v.null(),
    handler: async (ctx, args) => {
        const opp = await ctx.db.get(args.id);
        if (!opp) {
            throw new Error("Opportunity not found");
        }

        if (!canWriteOpportunity(ctx.identity, opp)) {
            throw new Error("Access denied");
        }

        // Verify stage index
        const campaign = await ctx.db.get(opp.campaignId);
        if (!campaign || args.stageIndex < 0 || args.stageIndex >= campaign.stages.length) {
            throw new Error(`Invalid stage index: ${args.stageIndex}`);
        }

        await ctx.db.patch(args.id, { stageIndex: args.stageIndex });
        return null;
    },
});

/**
 * Update assigned users.
 */


/**
 * Delete an opportunity.
 */
export const remove = authedMutation({
    args: { id: v.id("opportunities") },
    returns: v.null(),
    handler: async (ctx, args) => {
        const opp = await ctx.db.get(args.id);
        if (!opp) {
            throw new Error("Opportunity not found");
        }

        if (!canDeleteRecord(ctx.identity, opp, "org:opportunities")) {
            throw new Error("Access denied");
        }

        await ctx.db.delete(args.id);
        return null;
    },
});

/**
 * Toggle an assignee on an opportunity.
 */
export const toggleAssignee = authedMutation({
    args: {
        id: v.id("opportunities"),
        userId: v.string(),
    },
    returns: v.null(),
    handler: async (ctx, args) => {
        const opp = await ctx.db.get(args.id);
        if (!opp) {
            throw new Error("Opportunity not found");
        }

        if (!activeTenantOwnsResource(ctx.identity, opp.ownerId)) {
            throw new Error("Access denied");
        }

        // Must be assigner or admin to manage others. 
        // Assignees can only remove themselves.
        const isAdmin = hasAnyPermission(ctx.identity, "org:opportunities:global_update");
        const isAssigner = opp.assignerIds.includes(ctx.identity.subject);
        const isSelf = args.userId === ctx.identity.subject;
        const isAlreadyAssigned = opp.assignedUserIds.includes(args.userId);

        if (!isAdmin && !isAssigner) {
            if (!isAlreadyAssigned || !isSelf) {
                throw new Error("Access denied: requires assigner or admin permission to manage other assignees");
            }
        }

        if (isAlreadyAssigned) {
            await ctx.db.patch(args.id, {
                assignedUserIds: opp.assignedUserIds.filter((id) => id !== args.userId),
            });
        } else {
            await ctx.db.patch(args.id, {
                assignedUserIds: [...opp.assignedUserIds, args.userId],
            });
        }

        return null;
    },
});

/**
 * Toggle a follower on an opportunity.
 */
export const toggleFollower = authedMutation({
    args: {
        id: v.id("opportunities"),
        userId: v.string(),
    },
    returns: v.null(),
    handler: async (ctx, args) => {
        const opp = await ctx.db.get(args.id);
        if (!opp) {
            throw new Error("Opportunity not found");
        }

        if (!activeTenantOwnsResource(ctx.identity, opp.ownerId)) {
            throw new Error("Access denied");
        }

        const isAdmin = hasAnyPermission(ctx.identity, "org:opportunities:global_update");
        const isAssigner = opp.assignerIds.includes(ctx.identity.subject);
        const isSelf = args.userId === ctx.identity.subject;
        const isAlreadyFollowing = opp.followerIds.includes(args.userId);

        // Adding requires admin/assigner. Self-removal is always allowed.
        if (!isAdmin && !isAssigner) {
            if (!isAlreadyFollowing || !isSelf) {
                throw new Error("Access denied: requires assigner or admin permission to manage followers");
            }
        }

        if (isAlreadyFollowing) {
            await ctx.db.patch(args.id, {
                followerIds: opp.followerIds.filter((id) => id !== args.userId),
            });
        } else {
            await ctx.db.patch(args.id, {
                followerIds: [...opp.followerIds, args.userId],
            });
        }

        return null;
    },
});

/**
 * Toggle an assigner on an opportunity.
 */
export const toggleAssigner = authedMutation({
    args: {
        id: v.id("opportunities"),
        userId: v.string(),
    },
    returns: v.null(),
    handler: async (ctx, args) => {
        const opp = await ctx.db.get(args.id);
        if (!opp) {
            throw new Error("Opportunity not found");
        }

        if (!activeTenantOwnsResource(ctx.identity, opp.ownerId)) {
            throw new Error("Access denied");
        }

        // ONLY admins or existing assigners can manage assigners
        const isAdmin = hasAnyPermission(ctx.identity, "org:opportunities:global_update");
        const isAssigner = opp.assignerIds.includes(ctx.identity.subject);

        if (!isAdmin && !isAssigner) {
            throw new Error("Access denied: only assigners or admins can manage assigners");
        }

        const isAlreadyAssigner = opp.assignerIds.includes(args.userId);

        if (isAlreadyAssigner) {
            // Prevent removing the last assigner unless admin
            if (opp.assignerIds.length === 1 && !isAdmin) {
                throw new Error("Cannot remove the last assigner");
            }
            await ctx.db.patch(args.id, {
                assignerIds: opp.assignerIds.filter((id) => id !== args.userId),
            });
        } else {
            await ctx.db.patch(args.id, {
                assignerIds: [...opp.assignerIds, args.userId],
            });
        }

        return null;
    },
});
