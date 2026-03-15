import { v } from "convex/values";
import { authedQuery, authedMutation, activeTenantOwnsResource, requireAnyPermission } from "../helpers/authedFunctions";

// Reusable pipeline template validator for return types
const pipelineTemplateValidator = v.object({
    _id: v.id("pipelineTemplates"),
    _creationTime: v.number(),
    ownerId: v.string(),
    name: v.string(),
    stages: v.array(v.string()), // Stage names, order = array index
    assignedUserIds: v.array(v.string()),
    followerIds: v.array(v.string()),
    assignerIds: v.array(v.string()),
});

/**
 * List all pipeline templates.
 */
export const list = authedQuery({
    args: {},
    returns: v.array(pipelineTemplateValidator),
    handler: async (ctx) => {
        const templates = await ctx.db
            .query("pipelineTemplates")
            .withIndex("by_ownerId", (q) => q.eq("ownerId", ctx.tenantId))
            .collect();

        return templates.filter(template =>
            canReadRecord(ctx.identity, template, "org:pipelines")
        );
    },
});

import { ConvexError } from "convex/values";
import { canReadRecord, canUpdateRecord, canDeleteRecord, hasPermission } from "../auth";

/**
 * Create a new pipeline template.
 */
export const create = authedMutation({
    args: {
        name: v.string(),
        stages: v.array(v.string()),
    },
    returns: v.id("pipelineTemplates"),
    handler: async (ctx, args) => {
        requireAnyPermission(ctx.identity, "org:pipelines:global_create", "org:pipelines:global_update");

        return await ctx.db.insert("pipelineTemplates", {
            ownerId: ctx.tenantId,
            name: args.name,
            stages: args.stages,
            assignedUserIds: [ctx.identity.subject], // Creator is assigned
            followerIds: [],
            assignerIds: [ctx.identity.subject],    // Creator can manage membership
        });
    },
});

/**
 * Update a pipeline template.
 */
export const update = authedMutation({
    args: {
        id: v.id("pipelineTemplates"),
        name: v.optional(v.string()),
        stages: v.optional(v.array(v.string())),
    },
    returns: v.null(),
    handler: async (ctx, args) => {
        const template = await ctx.db.get(args.id);
        if (!template) {
            throw new ConvexError("Template not found");
        }

        if (!activeTenantOwnsResource(ctx.identity, template.ownerId)) {
            throw new ConvexError("Access denied");
        }

        if (!canUpdateRecord(ctx.identity, template, "org:pipelines")) {
            throw new ConvexError("Only assigned users or admins can update pipeline templates");
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
 * Delete a pipeline template.
 */
export const remove = authedMutation({
    args: { id: v.id("pipelineTemplates") },
    returns: v.null(),
    handler: async (ctx, args) => {
        const template = await ctx.db.get(args.id);
        if (!template) {
            throw new ConvexError("Template not found");
        }

        if (!activeTenantOwnsResource(ctx.identity, template.ownerId)) {
            throw new ConvexError("Access denied");
        }

        if (!canDeleteRecord(ctx.identity, template, "org:pipelines")) {
            throw new ConvexError("Only assigned users or admins can delete pipeline templates");
        }

        await ctx.db.delete(args.id);
        return null;
    },
});

/**
 * Toggle a user's assignee status for a pipeline template.
 */
export const toggleAssignee = authedMutation({
    args: {
        id: v.id("pipelineTemplates"),
        userId: v.string(),
    },
    returns: v.null(),
    handler: async (ctx, args) => {
        const template = await ctx.db.get(args.id);
        if (!template) throw new ConvexError("Template not found");
        if (!activeTenantOwnsResource(ctx.identity, template.ownerId)) throw new ConvexError("Access denied");

        const isAssigner = template.assignerIds?.includes(ctx.identity.subject);
        const isAdmin = hasPermission(ctx.identity, "org:pipelines:global_update");
        const isSelf = args.userId === ctx.identity.subject;

        if (!isAdmin && !isAssigner && !isSelf) {
            throw new ConvexError("Only admins, assigners, or the user themselves can manage assignments");
        }

        const currentIds = template.assignedUserIds || [];
        const newIds = currentIds.includes(args.userId)
            ? currentIds.filter(id => id !== args.userId)
            : [...currentIds, args.userId];

        await ctx.db.patch(args.id, { assignedUserIds: newIds });
        return null;
    },
});

/**
 * Toggle a user's follower status for a pipeline template.
 */
export const toggleFollower = authedMutation({
    args: {
        id: v.id("pipelineTemplates"),
        userId: v.string(),
    },
    returns: v.null(),
    handler: async (ctx, args) => {
        const template = await ctx.db.get(args.id);
        if (!template) throw new ConvexError("Template not found");
        if (!activeTenantOwnsResource(ctx.identity, template.ownerId)) throw new ConvexError("Access denied");

        const isAssigner = template.assignerIds?.includes(ctx.identity.subject);
        const isAdmin = hasPermission(ctx.identity, "org:pipelines:global_update");
        const isSelf = args.userId === ctx.identity.subject;

        if (!isAdmin && !isAssigner && !isSelf) {
            throw new ConvexError("Only admins, assigners, or the user themselves can manage followers");
        }

        const currentIds = template.followerIds || [];
        const newIds = currentIds.includes(args.userId)
            ? currentIds.filter(id => id !== args.userId)
            : [...currentIds, args.userId];

        await ctx.db.patch(args.id, { followerIds: newIds });
        return null;
    },
});

/**
 * Toggle a user's assigner status for a pipeline template.
 */
export const toggleAssigner = authedMutation({
    args: {
        id: v.id("pipelineTemplates"),
        userId: v.string(),
    },
    returns: v.null(),
    handler: async (ctx, args) => {
        const template = await ctx.db.get(args.id);
        if (!template) throw new ConvexError("Template not found");
        if (!activeTenantOwnsResource(ctx.identity, template.ownerId)) throw new ConvexError("Access denied");

        const isExistingAssigner = template.assignerIds?.includes(ctx.identity.subject);
        const isAdmin = hasPermission(ctx.identity, "org:pipelines:global_update");

        if (!isAdmin && !isExistingAssigner) {
            throw new ConvexError("Only admins or existing assigners can manage assigners");
        }

        const currentIds = template.assignerIds || [];
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

