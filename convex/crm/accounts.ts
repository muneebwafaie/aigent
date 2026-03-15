/**
 * Accounts - CRUD operations for company/organization accounts.
 */
import { v } from "convex/values";
import { authedQuery, authedMutation, activeTenantOwnsResource } from "../helpers/authedFunctions";
import { hasPermission, canReadRecord, canUpdateRecord, canDeleteRecord } from "../auth";

// Reusable account validator for return types
const accountValidator = v.object({
  _id: v.id("accounts"),
  _creationTime: v.number(),
  ownerId: v.string(),
  name: v.string(),
  industry: v.optional(v.string()),
  website: v.optional(v.string()),
  size: v.optional(v.string()),
  address: v.optional(v.string()),
  assignedUserIds: v.array(v.string()),     // Users with read+write access
  followerIds: v.array(v.string()),         // Users with read-only access
  assignerIds: v.array(v.string()),         // Users who can manage membership
});

// Extended account validator with contact count for get()
const accountWithCountValidator = v.object({
  _id: v.id("accounts"),
  _creationTime: v.number(),
  ownerId: v.string(),
  name: v.string(),
  industry: v.optional(v.string()),
  website: v.optional(v.string()),
  size: v.optional(v.string()),
  address: v.optional(v.string()),
  assignedUserIds: v.array(v.string()),
  followerIds: v.array(v.string()),
  assignerIds: v.array(v.string()),
  contactCount: v.number(),
});

/**
 * List all accounts for the current owner.
 * If user has global read permission, return all accounts.
 * Otherwise, return only accounts where user is assigned, a follower, or an assigner.
 */
export const list = authedQuery({
  args: {},
  returns: v.array(accountValidator),
  handler: async (ctx) => {
    const allAccounts = await ctx.db
      .query("accounts")
      .withIndex("by_ownerId", (q) => q.eq("ownerId", ctx.tenantId))
      .collect();

    return allAccounts.filter(account => canReadRecord(ctx.identity, account, "org:crm_accounts"));
  },
});

/**
 * Get a single account by ID with contact count.
 */
export const get = authedQuery({
  args: { id: v.id("accounts") },
  returns: v.union(accountWithCountValidator, v.null()),
  handler: async (ctx, args) => {
    const account = await ctx.db.get(args.id);
    if (!account) return null;

    if (!activeTenantOwnsResource(ctx.identity, account.ownerId)) {
      return null;
    }

    if (!canReadRecord(ctx.identity, account, "org:crm_accounts")) {
      return null;
    }

    // Count contacts for this account
    const contacts = await ctx.db
      .query("contacts")
      .withIndex("by_accountId", (q) => q.eq("accountId", args.id))
      .collect();

    return {
      ...account,
      contactCount: contacts.length,
    };
  },
});

/**
 * Create a new account.
 */
export const create = authedMutation({
  args: {
    name: v.string(),
    industry: v.optional(v.string()),
    website: v.optional(v.string()),
    size: v.optional(v.string()),
    address: v.optional(v.string()),
    assignedUserIds: v.optional(v.array(v.string())),
    followerIds: v.optional(v.array(v.string())),
    assignerIds: v.optional(v.array(v.string())),
  },
  returns: v.id("accounts"),
  handler: async (ctx, args) => {
    // Need global_create or global_update
    const canCreateGlobally = hasPermission(ctx.identity, "org:crm_accounts:global_create") || hasPermission(ctx.identity, "org:crm_accounts:global_update");

    if (ctx.identity.org_id && !canCreateGlobally) {
      throw new Error("Permission denied: requires account creation permission");
    }

    const assigned = args.assignedUserIds ?? [ctx.identity.subject];
    const assigners = args.assignerIds ?? [ctx.identity.subject];

    return await ctx.db.insert("accounts", {
      ownerId: ctx.tenantId,
      name: args.name,
      industry: args.industry,
      website: args.website,
      size: args.size,
      address: args.address,
      assignedUserIds: assigned,
      followerIds: args.followerIds ?? [],
      assignerIds: assigners,
    });
  },
});

/**
 * Update an existing account.
 */
export const update = authedMutation({
  args: {
    id: v.id("accounts"),
    name: v.optional(v.string()),
    industry: v.optional(v.string()),
    website: v.optional(v.string()),
    size: v.optional(v.string()),
    address: v.optional(v.string()),
    assignedUserIds: v.optional(v.array(v.string())),
    followerIds: v.optional(v.array(v.string())),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const account = await ctx.db.get(args.id);
    if (!account) {
      throw new Error("Account not found");
    }

    if (!activeTenantOwnsResource(ctx.identity, account.ownerId)) {
      throw new Error("Access denied");
    }

    if (!canUpdateRecord(ctx.identity, account, "org:crm_accounts")) {
      throw new Error("Access denied");
    }

    const { id: _, ...updates } = args;

    await ctx.db.patch(args.id, updates);
    return null;
  },
});

/**
 * Delete an account.
 */
export const remove = authedMutation({
  args: { id: v.id("accounts") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const account = await ctx.db.get(args.id);
    if (!account) {
      throw new Error("Account not found");
    }

    if (!activeTenantOwnsResource(ctx.identity, account.ownerId)) {
      throw new Error("Access denied");
    }

    if (!canDeleteRecord(ctx.identity, account, "org:crm_accounts")) {
      throw new Error("Access denied");
    }

    // Also unlink all contacts from this account
    const contacts = await ctx.db
      .query("contacts")
      .withIndex("by_accountId", (q) => q.eq("accountId", args.id))
      .collect();

    for (const contact of contacts) {
      await ctx.db.patch(contact._id, { accountId: undefined });
    }

    await ctx.db.delete(args.id);
    return null;
  },
});

/**
 * Toggle an assignee on an account.
 */
export const toggleAssignee = authedMutation({
  args: {
    id: v.id("accounts"),
    userId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const account = await ctx.db.get(args.id);
    if (!account) {
      throw new Error("Account not found");
    }

    if (!activeTenantOwnsResource(ctx.identity, account.ownerId)) {
      throw new Error("Access denied");
    }

    // Must be assigner or admin to manage others. 
    // Assignees can only remove themselves.
    const isAdmin = hasPermission(ctx.identity, "org:crm_accounts:global_update");
    const isAssigner = (account.assignerIds ?? []).includes(ctx.identity.subject);
    const isSelf = args.userId === ctx.identity.subject;
    const isAlreadyAssigned = (account.assignedUserIds ?? []).includes(args.userId);

    if (!isAdmin && !isAssigner) {
      if (!isAlreadyAssigned || !isSelf) {
        throw new Error("Access denied: requires assigner or admin permission to manage other assignees");
      }
    }

    if (isAlreadyAssigned) {
      await ctx.db.patch(args.id, {
        assignedUserIds: account.assignedUserIds.filter((id) => id !== args.userId),
      });
    } else {
      await ctx.db.patch(args.id, {
        assignedUserIds: [...(account.assignedUserIds ?? []), args.userId],
      });
    }

    return null;
  },
});

/**
 * Toggle a follower on an account.
 */
export const toggleFollower = authedMutation({
  args: {
    id: v.id("accounts"),
    userId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const account = await ctx.db.get(args.id);
    if (!account) {
      throw new Error("Account not found");
    }

    if (!activeTenantOwnsResource(ctx.identity, account.ownerId)) {
      throw new Error("Access denied");
    }

    const isAdmin = hasPermission(ctx.identity, "org:crm_accounts:global_update");
    const isAssigner = (account.assignerIds ?? []).includes(ctx.identity.subject);
    const isSelf = args.userId === ctx.identity.subject;
    const isAlreadyFollowing = (account.followerIds ?? []).includes(args.userId);

    // Anyone can follow themselves, but managing others requires admin/assigner
    if (!isSelf && !isAdmin && !isAssigner) {
      throw new Error("Access denied");
    }

    if (isAlreadyFollowing) {
      await ctx.db.patch(args.id, {
        followerIds: account.followerIds.filter((id) => id !== args.userId),
      });
    } else {
      await ctx.db.patch(args.id, {
        followerIds: [...(account.followerIds ?? []), args.userId],
      });
    }

    return null;
  },
});

/**
 * Toggle an assigner on an account.
 */
export const toggleAssigner = authedMutation({
  args: {
    id: v.id("accounts"),
    userId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const account = await ctx.db.get(args.id);
    if (!account) {
      throw new Error("Account not found");
    }

    if (!activeTenantOwnsResource(ctx.identity, account.ownerId)) {
      throw new Error("Access denied");
    }

    // ONLY admins or existing assigners can manage assigners
    const isAdmin = hasPermission(ctx.identity, "org:crm_accounts:global_update");
    const isAssigner = (account.assignerIds ?? []).includes(ctx.identity.subject);

    if (!isAdmin && !isAssigner) {
      throw new Error("Access denied: only assigners or admins can manage assigners");
    }

    const isAlreadyAssigner = (account.assignerIds ?? []).includes(args.userId);

    if (isAlreadyAssigner) {
      // Prevent removing the last assigner unless admin
      if (account.assignerIds.length === 1 && !isAdmin) {
        throw new Error("Cannot remove the last assigner");
      }
      await ctx.db.patch(args.id, {
        assignerIds: account.assignerIds.filter((id) => id !== args.userId),
      });
    } else {
      await ctx.db.patch(args.id, {
        assignerIds: [...(account.assignerIds ?? []), args.userId],
      });
    }

    return null;
  },
});
