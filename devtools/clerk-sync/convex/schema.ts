import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  permissions: defineTable({
    clerkId: v.string(),
    key: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
  })
    .index("by_clerk_id", ["clerkId"])
    .index("by_key", ["key"]),

  rolePermissions: defineTable({
    roleId: v.id("roles"),
    permissionId: v.id("permissions"),
  })
    .index("by_role", ["roleId"])
    .index("by_role_permission", ["roleId", "permissionId"]),

  roles: defineTable({
    clerkId: v.string(),
    key: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
  })
    .index("by_clerk_id", ["clerkId"])
    .index("by_key", ["key"]),
});
