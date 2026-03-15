/**
 * Contacts - CRUD operations for people.
 */
import { v } from "convex/values";
import { authedQuery, authedMutation, activeTenantOwnsResource } from "../helpers/authedFunctions";
import { hasPermission, canReadRecord, canUpdateRecord, canDeleteRecord } from "../auth";
import { Doc } from "../_generated/dataModel";

// Reusable contact validator for return types
const contactValidator = v.object({
  _id: v.id("contacts"),
  _creationTime: v.number(),
  ownerId: v.string(),
  accountId: v.optional(v.id("accounts")),
  firstName: v.string(),
  lastName: v.string(),
  email: v.optional(v.string()),
  phone: v.optional(v.string()),
  jobTitle: v.optional(v.string()),
  assignedUserIds: v.array(v.string()),
  followerIds: v.array(v.string()),
  assignerIds: v.array(v.string()),
});

// Row-level access helpers are now provided by generic can*Record functions

/**
 * List all contacts for the current owner.
 * Filters to contacts the user has access to (assigned, following, or assigner).
 */
export const list = authedQuery({
  args: {},
  returns: v.array(contactValidator),
  handler: async (ctx) => {
    const allContacts = await ctx.db
      .query("contacts")
      .withIndex("by_ownerId", (q) => q.eq("ownerId", ctx.tenantId))
      .collect();

    return allContacts.filter(c => canReadRecord(ctx.identity, c, "org:contacts"));
  },
});

/**
 * List contacts for a specific account (access-filtered).
 */
export const listByAccount = authedQuery({
  args: { accountId: v.id("accounts") },
  returns: v.array(contactValidator),
  handler: async (ctx, args) => {
    // First verify the account belongs to the current tenant
    const account = await ctx.db.get(args.accountId);
    if (!account || !activeTenantOwnsResource(ctx.identity, account.ownerId)) {
      return [];
    }

    const contacts = await ctx.db
      .query("contacts")
      .withIndex("by_accountId", (q) => q.eq("accountId", args.accountId))
      .collect();

    return contacts.filter(c => canReadRecord(ctx.identity, c, "org:contacts"));
  },
});

/**
 * Get a single contact by ID.
 */
export const get = authedQuery({
  args: { id: v.id("contacts") },
  returns: v.union(contactValidator, v.null()),
  handler: async (ctx, args) => {
    const contact = await ctx.db.get(args.id);
    if (!contact) return null;

    if (!activeTenantOwnsResource(ctx.identity, contact.ownerId)) {
      return null;
    }

    if (!canReadRecord(ctx.identity, contact, "org:contacts")) {
      return null;
    }

    return contact;
  },
});

/**
 * Create a new contact.
 */
export const create = authedMutation({
  args: {
    accountId: v.optional(v.id("accounts")),
    firstName: v.string(),
    lastName: v.string(),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    jobTitle: v.optional(v.string()),
    assignedUserIds: v.optional(v.array(v.string())),
    followerIds: v.optional(v.array(v.string())),
    assignerIds: v.optional(v.array(v.string())),
  },
  returns: v.id("contacts"),
  handler: async (ctx, args) => {
    // Need global_create or global_update
    const canCreateGlobally = hasPermission(ctx.identity, "org:contacts:global_create") || hasPermission(ctx.identity, "org:contacts:global_update");

    if (ctx.identity.org_id && !canCreateGlobally) {
      throw new Error("Permission denied: requires contacts creation permission");
    }

    const assigned = args.assignedUserIds ?? [ctx.identity.subject];
    const assigners = args.assignerIds ?? [ctx.identity.subject];

    return await ctx.db.insert("contacts", {
      ownerId: ctx.tenantId,
      accountId: args.accountId,
      firstName: args.firstName,
      lastName: args.lastName,
      email: args.email,
      phone: args.phone,
      jobTitle: args.jobTitle,
      assignedUserIds: assigned,
      followerIds: args.followerIds ?? [],
      assignerIds: assigners,
    });
  },
});

/**
 * Update an existing contact.
 */
export const update = authedMutation({
  args: {
    id: v.id("contacts"),
    accountId: v.optional(v.id("accounts")),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    jobTitle: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const contact = await ctx.db.get(args.id);
    if (!contact) {
      throw new Error("Contact not found");
    }

    if (!activeTenantOwnsResource(ctx.identity, contact.ownerId)) {
      throw new Error("Access denied");
    }

    if (!canUpdateRecord(ctx.identity, contact, "org:contacts")) {
      throw new Error("Access denied");
    }

    const { id, ...updates } = args;
    await ctx.db.patch(args.id, updates);
    return null;
  },
});

/**
 * Delete a contact.
 */
export const remove = authedMutation({
  args: { id: v.id("contacts") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const contact = await ctx.db.get(args.id);
    if (!contact) {
      throw new Error("Contact not found");
    }

    if (!activeTenantOwnsResource(ctx.identity, contact.ownerId)) {
      throw new Error("Access denied");
    }

    if (!canDeleteRecord(ctx.identity, contact, "org:contacts")) {
      throw new Error("Access denied");
    }

    await ctx.db.delete(args.id);
    return null;
  },
});

/**
 * Toggle an assignee on a contact.
 */
export const toggleAssignee = authedMutation({
  args: {
    id: v.id("contacts"),
    userId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const contact = await ctx.db.get(args.id);
    if (!contact) {
      throw new Error("Contact not found");
    }

    if (!activeTenantOwnsResource(ctx.identity, contact.ownerId)) {
      throw new Error("Access denied");
    }

    // Must be assigner or admin to manage others. 
    // Assignees can only remove themselves.
    const isAdmin = hasPermission(ctx.identity, "org:contacts:global_update");
    const isAssigner = (contact.assignerIds ?? []).includes(ctx.identity.subject);
    const isSelf = args.userId === ctx.identity.subject;
    const isAlreadyAssigned = (contact.assignedUserIds ?? []).includes(args.userId);

    if (!isAdmin && !isAssigner) {
      if (!isAlreadyAssigned || !isSelf) {
        throw new Error("Access denied: requires assigner or admin permission to manage other assignees");
      }
    }

    if (isAlreadyAssigned) {
      await ctx.db.patch(args.id, {
        assignedUserIds: contact.assignedUserIds.filter((id) => id !== args.userId),
      });
    } else {
      await ctx.db.patch(args.id, {
        assignedUserIds: [...(contact.assignedUserIds ?? []), args.userId],
      });
    }

    return null;
  },
});

/**
 * Toggle a follower on a contact.
 */
export const toggleFollower = authedMutation({
  args: {
    id: v.id("contacts"),
    userId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const contact = await ctx.db.get(args.id);
    if (!contact) {
      throw new Error("Contact not found");
    }

    if (!activeTenantOwnsResource(ctx.identity, contact.ownerId)) {
      throw new Error("Access denied");
    }

    const isAdmin = hasPermission(ctx.identity, "org:contacts:global_update");
    const isAssigner = (contact.assignerIds ?? []).includes(ctx.identity.subject);
    const isSelf = args.userId === ctx.identity.subject;
    const isAlreadyFollowing = (contact.followerIds ?? []).includes(args.userId);

    // Adding requires admin/assigner. Self-removal is always allowed.
    if (!isAdmin && !isAssigner) {
      if (!isAlreadyFollowing || !isSelf) {
        throw new Error("Access denied: requires assigner or admin permission to manage followers");
      }
    }

    if (isAlreadyFollowing) {
      await ctx.db.patch(args.id, {
        followerIds: contact.followerIds.filter((id) => id !== args.userId),
      });
    } else {
      await ctx.db.patch(args.id, {
        followerIds: [...(contact.followerIds ?? []), args.userId],
      });
    }

    return null;
  },
});

/**
 * Toggle an assigner on a contact.
 */
export const toggleAssigner = authedMutation({
  args: {
    id: v.id("contacts"),
    userId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const contact = await ctx.db.get(args.id);
    if (!contact) {
      throw new Error("Contact not found");
    }

    if (!activeTenantOwnsResource(ctx.identity, contact.ownerId)) {
      throw new Error("Access denied");
    }

    // ONLY admins or existing assigners can manage assigners
    const isAdmin = hasPermission(ctx.identity, "org:contacts:global_update");
    const isAssigner = (contact.assignerIds ?? []).includes(ctx.identity.subject);

    if (!isAdmin && !isAssigner) {
      throw new Error("Access denied: only assigners or admins can manage assigners");
    }

    const isAlreadyAssigner = (contact.assignerIds ?? []).includes(args.userId);

    if (isAlreadyAssigner) {
      // Prevent removing the last assigner unless admin
      if (contact.assignerIds.length === 1 && !isAdmin) {
        throw new Error("Cannot remove the last assigner");
      }
      await ctx.db.patch(args.id, {
        assignerIds: contact.assignerIds.filter((id) => id !== args.userId),
      });
    } else {
      await ctx.db.patch(args.id, {
        assignerIds: [...(contact.assignerIds ?? []), args.userId],
      });
    }

    return null;
  },
});

