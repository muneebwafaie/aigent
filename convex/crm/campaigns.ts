/**
 * Campaigns - CRUD operations for sales campaigns.
 * Campaigns copy stages from pipeline templates at creation time.
 */
import { v, ConvexError } from "convex/values";
import { authedQuery, authedMutation, requireAnyPermission, activeTenantOwnsResource } from "../helpers/authedFunctions";
import { hasPermission, canReadRecord, canUpdateRecord, canDeleteRecord } from "../auth";
import { Doc, Id } from "../_generated/dataModel";
import { AuthenticatedIdentity } from "../helpers/authedFunctions";

/**
 * Check if user has access to a campaign via its opportunities.
 * User has access if:
 * - They have global campaigns:read permission, OR
 * - They are assigned to or following at least one opportunity in the campaign
 */
async function canReadCampaignViaOpportunities(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    db: any,
    identity: AuthenticatedIdentity,
    campaignId: Id<"campaigns">
): Promise<boolean> {
    const opportunities: Doc<"opportunities">[] = await db
        .query("opportunities")
        .withIndex("by_campaignId", (q: { eq: (field: string, value: Id<"campaigns">) => unknown }) => q.eq("campaignId", campaignId))
        .collect();

    const userId = identity.subject;
    return opportunities.some(
        (opp) =>
            opp.assignedUserIds.includes(userId) ||
            opp.followerIds.includes(userId)
    );
}

// Reusable campaign validator for return types
// Stages are now a simple string array - order is determined by array index
const campaignValidator = v.object({
    _id: v.id("campaigns"),
    _creationTime: v.number(),
    ownerId: v.string(),
    name: v.string(),
    status: v.union(v.literal("active"), v.literal("archived")),
    stages: v.array(v.string()),
    templateId: v.id("pipelineTemplates"),
    pipelineTemplateName: v.optional(v.string()),
    assignedUserIds: v.array(v.string()),
    followerIds: v.array(v.string()),
    assignerIds: v.array(v.string()),
});

// Campaign with stats validator
const campaignWithStatsValidator = v.object({
    _id: v.id("campaigns"),
    _creationTime: v.number(),
    ownerId: v.string(),
    name: v.string(),
    status: v.union(v.literal("active"), v.literal("archived")),
    stages: v.array(v.string()),
    templateId: v.id("pipelineTemplates"),
    pipelineTemplateName: v.optional(v.string()),
    opportunityCount: v.number(),
    totalValue: v.number(),
    assignedUserIds: v.array(v.string()),
    followerIds: v.array(v.string()),
    assignerIds: v.array(v.string()),
});

/**
 * List campaigns, optionally filtered by status.
 */
export const list = authedQuery({
    args: {
        status: v.optional(v.union(v.literal("active"), v.literal("archived"))),
    },
    returns: v.array(campaignValidator),
    handler: async (ctx, args) => {
        // Get all campaigns for this tenant
        let campaigns: Doc<"campaigns">[];
        if (args.status) {
            campaigns = await ctx.db
                .query("campaigns")
                .withIndex("by_ownerId_and_status", (q) =>
                    q.eq("ownerId", ctx.tenantId).eq("status", args.status!)
                )
                .collect();
        } else {
            campaigns = await ctx.db
                .query("campaigns")
                .withIndex("by_ownerId", (q) => q.eq("ownerId", ctx.tenantId))
                .collect();
        }

        const accessibleCampaigns: Doc<"campaigns">[] = [];
        for (const campaign of campaigns) {
            if (canReadRecord(ctx.identity, campaign, "org:campaigns") || await canReadCampaignViaOpportunities(ctx.db, ctx.identity, campaign._id)) {
                accessibleCampaigns.push(campaign);
            }
        }
        return accessibleCampaigns;
    },
});

/**
 * Get a single campaign by ID with opportunity stats.
 */
export const get = authedQuery({
    args: { id: v.id("campaigns") },
    returns: v.union(campaignWithStatsValidator, v.null()),
    handler: async (ctx, args) => {
        const campaign = await ctx.db.get(args.id);
        if (!campaign) return null;

        if (!activeTenantOwnsResource(ctx.identity, campaign.ownerId)) {
            return null;
        }

        if (!canReadRecord(ctx.identity, campaign, "org:campaigns")) {
            const hasOpportunityAccess = await canReadCampaignViaOpportunities(ctx.db, ctx.identity, args.id);
            if (!hasOpportunityAccess) {
                return null;
            }
        }

        // Get opportunity stats
        const opportunities = await ctx.db
            .query("opportunities")
            .withIndex("by_campaignId", (q) => q.eq("campaignId", args.id))
            .collect();

        return {
            ...campaign,
            opportunityCount: opportunities.length,
            totalValue: opportunities.reduce((sum, o) => sum + o.value, 0),
        };
    },
});

/**
 * Create a new campaign, copying stages from a pipeline template.
 */
export const create = authedMutation({
    args: {
        name: v.string(),
        templateId: v.id("pipelineTemplates"),
    },
    returns: v.id("campaigns"),
    handler: async (ctx, args) => {
        requireAnyPermission(ctx.identity, "org:campaigns:global_create", "org:campaigns:global_update");

        // Get template and copy stages
        const template = await ctx.db.get(args.templateId);
        if (!template || !activeTenantOwnsResource(ctx.identity, template.ownerId)) {
            throw new ConvexError({ message: "Template not found or access denied" });
        }

        return await ctx.db.insert("campaigns", {
            ownerId: ctx.tenantId,
            name: args.name,
            status: "active" as const,
            stages: template.stages, // Copy stages from template
            templateId: args.templateId,
            pipelineTemplateName: template.name,
            assignedUserIds: [ctx.identity.subject], // Creator is assigned
            followerIds: [],
            assignerIds: [ctx.identity.subject],    // Creator can manage membership
        });
    },
});

/**
 * Update an existing campaign.
 */
export const update = authedMutation({
    args: {
        id: v.id("campaigns"),
        name: v.optional(v.string()),
    },
    returns: v.null(),
    handler: async (ctx, args) => {
        const campaign = await ctx.db.get(args.id);
        if (!campaign) {
            throw new ConvexError({ message: "Campaign not found" });
        }

        if (!activeTenantOwnsResource(ctx.identity, campaign.ownerId)) {
            throw new ConvexError({ message: "Access denied" });
        }

        if (!canUpdateRecord(ctx.identity, campaign, "org:campaigns")) {
            throw new ConvexError({ message: "Only assigned users or admins can update campaigns" });
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
 * Archive a campaign.
 */
export const archive = authedMutation({
    args: { id: v.id("campaigns") },
    returns: v.null(),
    handler: async (ctx, args) => {
        const campaign = await ctx.db.get(args.id);
        if (!campaign) {
            throw new ConvexError({ message: "Campaign not found" });
        }

        if (!activeTenantOwnsResource(ctx.identity, campaign.ownerId)) {
            throw new ConvexError({ message: "Access denied" });
        }

        if (!canUpdateRecord(ctx.identity, campaign, "org:campaigns")) {
            throw new ConvexError({ message: "Only assigned users or admins can archive campaigns" });
        }

        await ctx.db.patch(args.id, { status: "archived" as const });
        return null;
    },
});

/**
 * Delete a campaign (only if it has no opportunities).
 */
export const remove = authedMutation({
    args: { id: v.id("campaigns") },
    returns: v.null(),
    handler: async (ctx, args) => {
        const campaign = await ctx.db.get(args.id);
        if (!campaign) {
            throw new ConvexError({ message: "Campaign not found" });
        }

        if (!activeTenantOwnsResource(ctx.identity, campaign.ownerId)) {
            throw new ConvexError({ message: "Access denied" });
        }

        if (!canDeleteRecord(ctx.identity, campaign, "org:campaigns")) {
            throw new ConvexError({ message: "Only assigned users or admins can delete campaigns" });
        }

        // Check for existing opportunities
        const opportunities = await ctx.db
            .query("opportunities")
            .withIndex("by_campaignId", (q) => q.eq("campaignId", args.id))
            .take(1);

        if (opportunities.length > 0) {
            throw new ConvexError({
                message: "Cannot delete campaign with existing opportunities. Please archive it instead, or delete all opportunities first."
            });
        }

        await ctx.db.delete(args.id);
        return null;
    },
});

/**
 * Update campaign stages (rename and/or reorder).
 * Automatically updates opportunities to use new stage indexes.
 */
export const updateStages = authedMutation({
    args: {
        id: v.id("campaigns"),
        stages: v.array(v.string()),
        mapping: v.optional(v.record(v.string(), v.number())),
    },
    returns: v.null(),
    handler: async (ctx, args) => {
        const campaign = await ctx.db.get(args.id);
        if (!campaign) {
            throw new Error("Campaign not found");
        }

        if (!activeTenantOwnsResource(ctx.identity, campaign.ownerId)) {
            throw new Error("Access denied");
        }

        if (!canUpdateRecord(ctx.identity, campaign, "org:campaigns")) {
            throw new Error("Access denied");
        }

        // Get all opportunities for this campaign to validate stage indexes
        const opportunities = await ctx.db
            .query("opportunities")
            .withIndex("by_campaignId", (q) => q.eq("campaignId", args.id))
            .collect();

        const maxNewIndex = args.stages.length - 1 < 0 ? 0 : args.stages.length - 1;
        for (const opp of opportunities) {
            let newIndex = opp.stageIndex;

            // Map to new index if a mapping is provided
            if (args.mapping && args.mapping[opp.stageIndex.toString()] !== undefined) {
                newIndex = args.mapping[opp.stageIndex.toString()];
            }

            // Fallback: constraint within bounds
            if (newIndex > maxNewIndex) {
                newIndex = maxNewIndex;
            }

            if (newIndex !== opp.stageIndex) {
                await ctx.db.patch(opp._id, { stageIndex: newIndex });
            }
        }

        await ctx.db.patch(args.id, { stages: args.stages });
        return null;
    },
});

/**
 * Toggle a user's assignee status for a campaign.
 */
export const toggleAssignee = authedMutation({
    args: {
        id: v.id("campaigns"),
        userId: v.string(),
    },
    returns: v.null(),
    handler: async (ctx, args) => {
        const campaign = await ctx.db.get(args.id);
        if (!campaign) throw new ConvexError("Campaign not found");
        if (!activeTenantOwnsResource(ctx.identity, campaign.ownerId)) throw new ConvexError("Access denied");

        const isAssigner = campaign.assignerIds?.includes(ctx.identity.subject);
        const isAdmin = hasPermission(ctx.identity, "org:campaigns:global_update");
        const isSelf = args.userId === ctx.identity.subject;
        const isAlreadyAssigned = (campaign.assignedUserIds || []).includes(args.userId);

        // Adding requires admin/assigner. Self-removal is always allowed.
        if (!isAdmin && !isAssigner) {
            if (!isAlreadyAssigned || !isSelf) {
                throw new ConvexError("Access denied: requires assigner or admin permission to manage assignees");
            }
        }

        const currentIds = campaign.assignedUserIds || [];
        const newIds = currentIds.includes(args.userId)
            ? currentIds.filter(id => id !== args.userId)
            : [...currentIds, args.userId];

        await ctx.db.patch(args.id, { assignedUserIds: newIds });
        return null;
    },
});

/**
 * Toggle a user's follower status for a campaign.
 */
export const toggleFollower = authedMutation({
    args: {
        id: v.id("campaigns"),
        userId: v.string(),
    },
    returns: v.null(),
    handler: async (ctx, args) => {
        const campaign = await ctx.db.get(args.id);
        if (!campaign) throw new ConvexError("Campaign not found");
        if (!activeTenantOwnsResource(ctx.identity, campaign.ownerId)) throw new ConvexError("Access denied");

        const isAssigner = campaign.assignerIds?.includes(ctx.identity.subject);
        const isAdmin = hasPermission(ctx.identity, "org:campaigns:global_update");
        const isSelf = args.userId === ctx.identity.subject;
        const isAlreadyFollowing = (campaign.followerIds || []).includes(args.userId);

        // Adding requires admin/assigner. Self-removal is always allowed.
        if (!isAdmin && !isAssigner) {
            if (!isAlreadyFollowing || !isSelf) {
                throw new ConvexError("Access denied: requires assigner or admin permission to manage followers");
            }
        }

        const currentIds = campaign.followerIds || [];
        const newIds = currentIds.includes(args.userId)
            ? currentIds.filter(id => id !== args.userId)
            : [...currentIds, args.userId];

        await ctx.db.patch(args.id, { followerIds: newIds });
        return null;
    },
});

/**
 * Toggle a user's assigner status for a campaign.
 */
export const toggleAssigner = authedMutation({
    args: {
        id: v.id("campaigns"),
        userId: v.string(),
    },
    returns: v.null(),
    handler: async (ctx, args) => {
        const campaign = await ctx.db.get(args.id);
        if (!campaign) throw new ConvexError("Campaign not found");
        if (!activeTenantOwnsResource(ctx.identity, campaign.ownerId)) throw new ConvexError("Access denied");

        const isExistingAssigner = campaign.assignerIds?.includes(ctx.identity.subject);
        const isAdmin = hasPermission(ctx.identity, "org:campaigns:global_update");

        if (!isAdmin && !isExistingAssigner) {
            throw new ConvexError("Only admins or existing assigners can manage assigners");
        }

        const currentIds = campaign.assignerIds || [];
        let newIds: string[];

        if (currentIds.includes(args.userId)) {
            if (currentIds.length === 1) {
                throw new ConvexError("Cannot remove the last assigner");
            }
            newIds = currentIds.filter(id => id !== args.userId);
        } else {
            newIds = [...currentIds, args.userId];
        }

        await ctx.db.patch(args.id, { assignerIds: newIds });
        return null;
    },
});
