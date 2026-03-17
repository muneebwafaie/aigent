import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getUserIdentity, resolveTenantId } from "./auth";

/**
 * List all contacts for the current tenant.
 */
export const list = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("contacts"),
      _creationTime: v.number(),
      tenantId: v.string(),
      firstName: v.string(),
      lastName: v.string(),
      email: v.optional(v.string()),
      phone: v.optional(v.string()),
      jobTitle: v.optional(v.string()),
      company: v.optional(v.string()),
    })
  ),
  handler: async (ctx) => {
    const identity = await getUserIdentity(ctx);
    if (!identity) throw new Error("Unauthenticated");

    const tenantId = resolveTenantId(identity);

    return await ctx.db
      .query("contacts")
      .withIndex("by_tenantId", (q) => q.eq("tenantId", tenantId))
      .collect();
  },
});

/**
 * Get a single contact by ID.
 */
export const get = query({
  args: { id: v.id("contacts") },
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("contacts"),
      _creationTime: v.number(),
      tenantId: v.string(),
      firstName: v.string(),
      lastName: v.string(),
      email: v.optional(v.string()),
      phone: v.optional(v.string()),
      jobTitle: v.optional(v.string()),
      company: v.optional(v.string()),
    })
  ),
  handler: async (ctx, args) => {
    const identity = await getUserIdentity(ctx);
    if (!identity) throw new Error("Unauthenticated");

    const contact = await ctx.db.get(args.id);
    if (!contact) return null;

    const tenantId = resolveTenantId(identity);
    if (contact.tenantId !== tenantId) {
      throw new Error("Unauthorized access to contact");
    }

    return contact;
  },
});

/**
 * Create a new contact.
 */
export const create = mutation({
  args: {
    firstName: v.string(),
    lastName: v.string(),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    jobTitle: v.optional(v.string()),
    company: v.optional(v.string()),
  },
  returns: v.id("contacts"),
  handler: async (ctx, args) => {
    const identity = await getUserIdentity(ctx);
    if (!identity) throw new Error("Unauthenticated");

    const tenantId = resolveTenantId(identity);

    return await ctx.db.insert("contacts", {
      ...args,
      tenantId,
    });
  },
});

/**
 * Update an existing contact.
 */
export const update = mutation({
  args: {
    id: v.id("contacts"),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    jobTitle: v.optional(v.string()),
    company: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {

    const identity = await getUserIdentity(ctx);
    if (!identity) throw new Error("Unauthenticated");

    const { id, ...updates } = args;
    const existing = await ctx.db.get(id);
    if (!existing) throw new Error("Contact not found");

    const tenantId = resolveTenantId(identity);
    if (existing.tenantId !== tenantId) {
      throw new Error("Unauthorized access to contact");
    }

    await ctx.db.patch(id, updates);
    return null;
  },
});

/**
 * Remove a contact.
 */
export const remove = mutation({
  args: { id: v.id("contacts") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await getUserIdentity(ctx);
    if (!identity) throw new Error("Unauthenticated");

    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Contact not found");

    const tenantId = resolveTenantId(identity);
    if (existing.tenantId !== tenantId) {
      throw new Error("Unauthorized access to contact");
    }

    await ctx.db.delete(args.id);
    return null;
  },
});