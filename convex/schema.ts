import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"

export default defineSchema({
    documents: defineTable({
        title: v.string(),
        userId: v.string(),
        userName: v.optional(v.string()),
        creatorName: v.optional(v.string()),
        shortId: v.string(),
        isShort: v.optional(v.boolean()),
        isAcrhived: v.boolean(),
        parentDocument: v.optional(v.union(v.id("documents"), v.null())),
        content: v.optional(v.string()),
        coverImage: v.optional(v.string()),
        icon: v.optional(v.string()),
        isPublished: v.boolean(),
        lastEditor: v.optional(v.string()),
        lastEditTime: v.optional(v.string()),
        verifed: v.optional(v.boolean()),
        views: v.optional(v.number()),
    })
    .index("by_user", ["userId"])
    .index("by_user_parent", ["userId", "parentDocument"])
})