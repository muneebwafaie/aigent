import { internalMutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

export const clearAll = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Delete all role-permission relationships first
    const rolePermissions = await ctx.db.query("rolePermissions").collect();
    await Promise.all(rolePermissions.map((rp) => ctx.db.delete(rp._id)));

    // Delete all roles
    const roles = await ctx.db.query("roles").collect();
    await Promise.all(roles.map((r) => ctx.db.delete(r._id)));

    // Delete all permissions
    const permissions = await ctx.db.query("permissions").collect();
    await Promise.all(permissions.map((p) => ctx.db.delete(p._id)));
  },
});

export const upsertPermission = internalMutation({
  args: {
    clerkId: v.string(),
    key: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("permissions")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        key: args.key,
        name: args.name,
        description: args.description,
      });
    } else {
      await ctx.db.insert("permissions", {
        clerkId: args.clerkId,
        key: args.key,
        name: args.name,
        description: args.description,
      });
    }
  },
});

export const deletePermission = internalMutation({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("permissions")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
    }
  },
});

export const upsertRole = internalMutation({
  args: {
    clerkId: v.string(),
    key: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
    permissionKeys: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("roles")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    const desiredPermissionIds = (await Promise.all(args.permissionKeys.map(async key => (await ctx.db
      .query("permissions")
      .withIndex("by_key", q => q.eq("key", key))
      .unique()
    )?._id))).filter(id => id !== undefined)

    let roleId: Id<"roles">;

    if (existing) {
      roleId = existing._id;
      await ctx.db.patch(existing._id, {
        key: args.key,
        name: args.name,
        description: args.description,
      });
    } else {
      roleId = await ctx.db.insert("roles", {
        clerkId: args.clerkId,
        key: args.key,
        name: args.name,
        description: args.description,
      });
    }

    // Delete extra permissions (exist in DB but not in desired state)
    const existingPermissionIds = (await ctx.db
      .query("rolePermissions")
      .withIndex("by_role", q => q.eq("roleId", roleId))
      .collect()).map(link => link.permissionId);

    const permissionsToDelete = existingPermissionIds.filter(
      id => !desiredPermissionIds.includes(id)
    );

    await Promise.all(permissionsToDelete.map(async (permissionId) => {
      const relation = await ctx.db
        .query("rolePermissions")
        .withIndex("by_role_permission", (q) => q.eq("roleId", roleId).eq("permissionId", permissionId))
        .first();
      if (relation) {
        await ctx.db.delete(relation._id);
      }
    }));

    // Insert missing permissions (in desired state but not in DB)
    await Promise.all(desiredPermissionIds.map(async (permissionId) => {
      const existingRelation = await ctx.db
        .query("rolePermissions")
        .withIndex("by_role_permission", (q) => q.eq("roleId", roleId).eq("permissionId", permissionId))
        .first();
      if (existingRelation) return;
      await ctx.db.insert("rolePermissions", { roleId, permissionId });
    }));

  },
});

export const deleteRole = internalMutation({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("roles")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
    }
  },
});

export const getAllRolesAndPermissions = query({
  args: {},
  handler: async (ctx) => {
    const permissions = await ctx.db.query("permissions").collect();
    const roles = await ctx.db.query("roles").collect();

    const rolesWithPermissions = await Promise.all(roles.map(async role => {
      const rolePermLinks = await ctx.db
        .query("rolePermissions")
        .withIndex("by_role", q => q.eq("roleId", role._id))
        .collect();

      const rolePermissions = (await Promise.all(rolePermLinks.map(async link => await ctx.db.get(link.permissionId)))).filter(perm => perm !== null)

      return { ...role, permissions: rolePermissions }
    }));

    return { permissions, roles: rolesWithPermissions };
  },
});
