import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    // Pipeline Templates - blueprints for campaigns
    pipelineTemplates: defineTable({
        ownerId: v.string(), // owning tenant ID (organization ID or user ID)
        name: v.string(),
        stages: v.array(v.string()), // Stage names, order = array index
        assignedUserIds: v.array(v.string()), // Users with read+write access
        followerIds: v.array(v.string()),     // Users with read-only access
        assignerIds: v.array(v.string()),     // Users who can manage membership
    }).index("by_ownerId", ["ownerId"]),

    // Accounts - companies/organizations
    accounts: defineTable({
        ownerId: v.string(), // owning tenant ID (organization ID or user ID)
        name: v.string(),
        industry: v.optional(v.string()),
        website: v.optional(v.string()),
        size: v.optional(v.string()),
        address: v.optional(v.string()),
        assignedUserIds: v.array(v.string()), // Users with read+write access
        followerIds: v.array(v.string()),     // Users with read-only access
        assignerIds: v.array(v.string()),     // Users who can manage membership
    }).index("by_ownerId", ["ownerId"]),

    // Contacts - people associated with accounts
    contacts: defineTable({
        ownerId: v.string(), // owning tenant ID (organization ID or user ID)
        accountId: v.optional(v.id("accounts")),
        firstName: v.string(),
        lastName: v.string(),
        email: v.optional(v.string()),
        phone: v.optional(v.string()),
        jobTitle: v.optional(v.string()),
        assignedUserIds: v.array(v.string()), // Users with read+write access
        followerIds: v.array(v.string()),     // Users with read-only access
        assignerIds: v.array(v.string()),     // Users who can manage membership
    })
        .index("by_ownerId", ["ownerId"])
        .index("by_accountId", ["accountId"]),

    // Campaigns - containers for opportunities, stages copied from template
    campaigns: defineTable({
        ownerId: v.string(), // owning tenant ID (organization ID or user ID)
        name: v.string(),
        status: v.union(v.literal("active"), v.literal("archived")),
        stages: v.array(v.string()), // Stage names, order = array index
        templateId: v.id("pipelineTemplates"),
        pipelineTemplateName: v.optional(v.string()),
        assignedUserIds: v.array(v.string()), // Users with read+write access
        followerIds: v.array(v.string()),     // Users with read-only access
        assignerIds: v.array(v.string()),     // Users who can manage membership
    })
        .index("by_ownerId", ["ownerId"])
        .index("by_ownerId_and_status", ["ownerId", "status"]),

    // Opportunities - deals within campaigns
    opportunities: defineTable({
        ownerId: v.string(), // owning tenant ID (organization ID or user ID)
        campaignId: v.id("campaigns"),
        contactId: v.optional(v.id("contacts")),
        accountId: v.optional(v.id("accounts")),
        title: v.string(),
        value: v.number(),
        probability: v.number(),
        expectedCloseDate: v.optional(v.number()),
        stageIndex: v.number(), // Index into campaign.stages array
        assignedUserIds: v.array(v.string()), // Users with read+write access
        followerIds: v.array(v.string()),     // Users with read-only access
        assignerIds: v.array(v.string()),     // Users who can manage membership
    })
        .index("by_ownerId", ["ownerId"])
        .index("by_campaignId", ["campaignId"])
        .index("by_campaignId_and_stageIndex", ["campaignId", "stageIndex"]),
});
