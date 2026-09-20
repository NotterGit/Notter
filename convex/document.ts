import { v } from "convex/values"
import { mutation, query, type MutationCtx } from "./_generated/server"
import { Doc, Id } from "./_generated/dataModel"
import { generateRandomId } from "./genId"

const getDocumentLimit = (premiumLevel?: number, isOrg?: boolean) => {
    if (premiumLevel === 1) {
        return isOrg ? 500 : 200
    }

    if (premiumLevel === 2) {
        return 1000
    }

    return 50
}

async function assertCanCreateDocument(ctx: MutationCtx, userId: string, premiumLevel?: number, isOrg?: boolean) {
    const documents = await ctx.db
        .query("documents")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .collect()

    const documentLimit = getDocumentLimit(premiumLevel, isOrg)

    if (documents.length >= documentLimit) {
        throw new Error(`Rate limited note:${documentLimit}`)
    }
}

export const archive = mutation({
    args: {
      id: v.id("documents"),
      userId: v.string()
    },
    handler: async(ctx, args) => {
        const identify = await ctx.auth.getUserIdentity()

        if (!identify) {
            throw new Error("Not authenticated")
        }

        const existingDocument = await ctx.db.get(args.id)

        if(!existingDocument){
            throw new Error("404")
        }

        if(existingDocument.userId !== args.userId){
            throw new Error("401")
        }

        const now = new Date().toISOString()

        const recursiveArchive = async (documentId: Id<"documents">) => {
            const children = await ctx.db.query("documents").withIndex("by_user_parent", (q) => (
                q.eq("userId", args.userId).eq("parentDocument", documentId)
            )).collect()

            for(const child of children){
                await ctx.db.patch(child._id, {
                    isAcrhived: true,
                    archivedTime: now
                })

                await recursiveArchive(child._id)
            }
        }

        const document = await ctx.db.patch(args.id, {
            isAcrhived: true,
            archivedTime: now
        })

        await recursiveArchive(args.id)

        // Clean up any already expired documents for this user
        const archiveSetting = await ctx.db
            .query("archiveSettings")
            .withIndex("by_user", (q) => q.eq("userId", args.userId))
            .first()

        const retentionDays = archiveSetting?.retentionDays ?? 7
        const cutoff = Date.now() - retentionDays * 24 * 60 * 60 * 1000

        const expiredDocs = await ctx.db
            .query("documents")
            .withIndex("by_user", (q) => q.eq("userId", args.userId))
            .filter((q) => q.eq(q.field("isAcrhived"), true))
            .collect()

        for (const doc of expiredDocs) {
            if (doc._id === args.id) continue
            const docTime = doc.archivedTime
                ? new Date(doc.archivedTime).getTime()
                : (doc.lastEditTime ? new Date(doc.lastEditTime).getTime() : doc._creationTime)
            if (docTime <= cutoff) {
                await ctx.db.delete(doc._id)
            }
        }

        return document
    }
})

export const getSidebar = query({
    args: {
        parentDocument: v.optional(v.id("documents")),
        userId: v.string(),
        publicSorted: v.optional(v.boolean())
    },
    handler: async(ctx, args) => {
        if (!args.publicSorted) {
            const identify = await ctx.auth.getUserIdentity()

            if (!identify) {
                throw new Error("Not authenticated")
            }
        }

        let queryBuilder = ctx.db.query("documents")
            .withIndex("by_user_parent", (q) => q
                .eq("userId", args.userId)
                .eq("parentDocument", args.parentDocument)
            ).filter((q) => 
                q.eq(q.field("isAcrhived"), false)
            )

        if (args.publicSorted) {
            queryBuilder = queryBuilder.filter((q) => 
                q.eq(q.field("isPublished"), true)
            )
        }

        const documents = await queryBuilder
            .order("desc")
            .collect()

        return documents.sort((a, b) => {
            const aPinned = Boolean(a.isPinned)
            const bPinned = Boolean(b.isPinned)
            if (aPinned !== bPinned) {
                return aPinned ? -1 : 1
            }
            if (a.order !== undefined && b.order !== undefined) {
                return a.order - b.order
            }
            if (a.order !== undefined) return -1
            if (b.order !== undefined) return 1
            return b._creationTime - a._creationTime
        })
    }
})

export const getAllSidebar = query({
    args: {
        userId: v.string(),
    },
    handler: async(ctx, args) => {
        const identify = await ctx.auth.getUserIdentity()

        if (!identify) {
            throw new Error("Not authenticated")
        }

        const documents = await ctx.db
            .query("documents")
            .withIndex("by_user", (q) => q.eq("userId", args.userId))
            .filter((q) => q.eq(q.field("isAcrhived"), false))
            .collect()

        return documents.sort((a, b) => {
            const aPinned = Boolean(a.isPinned)
            const bPinned = Boolean(b.isPinned)
            if (aPinned !== bPinned) {
                return aPinned ? -1 : 1
            }
            if (a.order !== undefined && b.order !== undefined) {
                return a.order - b.order
            }
            if (a.order !== undefined) return -1
            if (b.order !== undefined) return 1
            return b._creationTime - a._creationTime
        })
    }
})

export const create = mutation({
    args: {
        title: v.string(),
        parentDocument: v.optional(v.id("documents")),
        userId: v.string(),
        lastEditor: v.string(),
        lastEditTime: v.optional(v.string()),
        creatorName: v.string(),
        premiumLevel: v.optional(v.number()),
        isOrg: v.optional(v.boolean())
    },
    handler: async(ctx, args) => {
        const identify = await ctx.auth.getUserIdentity()

        if (!identify){
            throw new Error("Not authenticated")
        }

        await assertCanCreateDocument(ctx, args.userId, args.premiumLevel, args.isOrg)

        const document = await ctx.db.insert("documents", {
            title: args.title,
            parentDocument: args.parentDocument,
            shortId: generateRandomId(),
            userId: args.userId,
            userName: args.lastEditor,
            creatorName: args.creatorName,
            isAcrhived: false,
            isPublished: false,
            lastEditor: args.lastEditor,
            lastEditTime: args.lastEditTime ?? new Date().toISOString()
        })

        return document
    }
})

export const getTrash = query({
    args: {
      userId: v.string()
    },
    handler: async(ctx, args) => {
        const identify = await ctx.auth.getUserIdentity()

        if (!identify){
            throw new Error("Not authenticated")
        }

        const documents = await ctx.db.query("documents")
            .withIndex("by_user", (q) => q
                .eq("userId", args.userId)
            ).filter((q) =>
                q.eq(q.field("isAcrhived"), true)
            )
            .order("desc")
            .collect()

        const setting = await ctx.db
            .query("archiveSettings")
            .withIndex("by_user", (q) => q.eq("userId", args.userId))
            .first()

        const retentionDays = setting?.retentionDays ?? 7
        const cutoff = Date.now() - retentionDays * 24 * 60 * 60 * 1000

        return documents.filter((doc) => {
            const docTime = doc.archivedTime
                ? new Date(doc.archivedTime).getTime()
                : (doc.lastEditTime ? new Date(doc.lastEditTime).getTime() : doc._creationTime)
            return docTime > cutoff
        })
    }
})

export const restore = mutation({
    args: {
      id: v.id("documents"),
      userId: v.string()
    },
    handler: async(ctx, args) => {
        const identify = await ctx.auth.getUserIdentity()

        if (!identify){
            throw new Error("Not authenticated")
        }

        const existingDocument = await ctx.db.get(args.id)

        if(!existingDocument) {
            throw new Error("Not found")
        }

        if(existingDocument.userId !== args.userId) {
            throw new Error("Unauthorized")
        }

        const recursiveRestore = async (documentId: Id<"documents">) => {
            const children = await ctx.db.query("documents")
                .withIndex("by_user_parent", (q) => q
                    .eq("userId", args.userId)
                    .eq("parentDocument", documentId)
                )
                .collect()
        
            for (const child of children) {
                await ctx.db.patch(child._id, {
                    isAcrhived: false,
                    archivedTime: undefined,
                })
        
                await recursiveRestore(child._id)
            }
        }

        const options: Partial<Doc<"documents">> = {
            isAcrhived: false,
            archivedTime: undefined,
        }

        if(existingDocument.parentDocument){
            const parent = await ctx.db.get(existingDocument.parentDocument)
            if(parent?.isAcrhived){
                options.parentDocument = undefined
            }
        }

        const document = await ctx.db.patch(args.id, options)
        
        await recursiveRestore(args.id)

        return document
    }
})

export const remove = mutation({
    args: {
      id: v.id("documents"),
      userId: v.string()
    },
    handler: async (ctx, args) => {
      const identity = await ctx.auth.getUserIdentity()
  
      if (!identity) {
        throw new Error("Not authenticated")
      }
  
      const exisingDocument = await ctx.db.get(args.id)
  
      if (!exisingDocument) {
        throw new Error("Document not found")
      }
  
      if (exisingDocument.userId !== args.userId) {
        throw new Error("Not authorized")
      }
  
      const document = await ctx.db.delete(args.id)
  
      return document
    }
})

export const getSearch = query({
    args: {
      userId: v.string()
    },
    handler: async (ctx, args) => {
      const identity = await ctx.auth.getUserIdentity()
  
      if (!identity) {
        throw new Error("Not authenticated")
      }
    
      const documents = await ctx.db
        .query("documents")
        .withIndex("by_user", (q) => q.eq("userId", args.userId))
        .filter((q) => q.eq(q.field("isAcrhived"), false))
        .order("desc")
        .collect()
  
      return documents
    }
})

export const getById = query({
    args: {
      documentId: v.union(v.id("documents"), v.null()),
      userId: v.optional(v.string()),
      alwaysView: v.optional(v.boolean())
    },
    handler: async (ctx, args) => {
      const identity = await ctx.auth.getUserIdentity()

      if (args.documentId === null) {
        return null
      }

      const document = await ctx.db.get(args.documentId)
  
      if (!document) {
        return null
      }
  
      if (document.isPublished && !document.isAcrhived) {
        return document
      }
  
      if (!identity) {
        return null
      }
    
      if (document.userId !== args.userId && args.alwaysView === false) {
        return null
      }
  
      return document
    }
})

export const getByShortId = query({
  args: { shortId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    if (!args.shortId) {
      return null
    }

    const document = await ctx.db
      .query("documents")
      .filter((q) => q.eq(q.field("shortId"), args.shortId))
      .first()

    if (!document) {
      return null
    }

    if (document.isPublished && !document.isAcrhived) {
      return document
    }

    return null
  }
})

export const getDocumentCount = query({
  args: {
    userId: v.string()
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()

    if (!identity || !args.userId){ 
      return null
    }

    const documentCount = await ctx.db
      .query("documents")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect()

    return documentCount.length
  }
})

export const getPublicDocumentCount = query({
  args: {
    userId: v.string()
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()

    if (!identity || !args.userId){ 
      return null
    }

    const publicDocuments = await ctx.db
      .query("documents")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("isPublished"), true))
      .collect()

    return publicDocuments.length
  }
})

export const getVerifiedDocumentCount = query({
  args: {
    userId: v.string()
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()

    if (!identity || !args.userId){ 
      return null
    }

    const publicDocuments = await ctx.db
      .query("documents")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("verifed"), true))
      .collect()

    return publicDocuments.length
  }
})

export const update = mutation({
    args: {
      id: v.id("documents"),
      title: v.optional(v.string()),
      content: v.optional(v.string()),
      coverImage: v.optional(v.string()),
      icon: v.optional(v.string()),
      isPublished: v.optional(v.boolean()),
      parentDocument: v.optional(v.union(v.id("documents"), v.null())),
      userId: v.string(),
      lastEditor: v.optional(v.string()),
      lastEditTime: v.optional(v.string()),
      isShort: v.optional(v.boolean()),
      shortId: v.optional(v.string()),
      verifed: v.optional(v.boolean()),
      isAcrhived: v.optional(v.boolean()),
      archivedTime: v.optional(v.string()),
      isPinned: v.optional(v.boolean()),
      order: v.optional(v.number())
    },
    handler: async (ctx, args) => {
      const identity = await ctx.auth.getUserIdentity()
  
      if (!identity) {
        throw new Error("Not authenticated")
      }
    
      const { id, ...rest } = args
  
      const existingDocument = await ctx.db.get(args.id)
  
      if (!existingDocument) {
        throw new Error("Document not found")
      }
      
      if (existingDocument.userId !== args.userId) {
        throw new Error("Unauthorized")
      }

      if (args.shortId) {
        const documents = await ctx.db.query("documents")
          .filter((q) => q.eq(q.field("shortId"), args.shortId))
          .collect()

        if (documents.length > 0) {
          throw new Error("Short ID already exists")
        }
      }
      
      if (rest.parentDocument === null) {
        rest.parentDocument = undefined
        args.parentDocument = undefined
      }

      if (rest.isAcrhived !== undefined) {
        if (rest.isAcrhived) {
          rest.archivedTime = rest.archivedTime ?? new Date().toISOString()
        } else {
          rest.archivedTime = undefined
        }
      }
      
      const document = await ctx.db.patch(args.id, {
        ...rest,
      })
      
      return document
    }
})

export const removeIcon = mutation({
    args: {
      id: v.id("documents"),
      userId: v.string()
    },
    handler: async (ctx, args) => {
      const identity = await ctx.auth.getUserIdentity()
  
      if (!identity) {
        throw new Error("Not authenticated")
      }
    
      const existingDocument = await ctx.db.get(args.id)
  
      if (!existingDocument) {
        throw new Error("Document not found")
      }
  
      if (existingDocument.userId !== args.userId) {
        throw new Error("Unauthorized")
      }
  
      const document = await ctx.db.patch(args.id, {
        icon: undefined
      })
  
      return document
    }
})

export const removeCoverImage = mutation({
  args: {
    id: v.id("documents"),
    userId: v.string()
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()

    if (!identity) {
      throw new Error("Not authenticated")
    }

    const existingDocument = await ctx.db.get(args.id)

    if (!existingDocument) {
      throw new Error("Document not found")
    }

    if (existingDocument.userId !== args.userId) {
      throw new Error("Unauthorized")
    }

    const document = await ctx.db.patch(args.id, {
      coverImage: undefined,
    })

    return document
  }
})

export const incrementViews = mutation({
  args: {
    id: v.id("documents"),
  },
  handler: async (ctx, args) => {
    const document = await ctx.db.get(args.id)

    if (!document || !document.isPublished || document.isAcrhived) {
      return
    }

    await ctx.db.patch(args.id, {
      views: (document.views ?? 0) + 1,
    })
  }
})

export const getTestPage = query({
  handler: async (ctx) => {
    const document = await ctx.db.query("documents")
      .filter((q) => q.eq(q.field("shortId"), "TEST-PAGE"))
      .collect()

    return document[0]
  }
})

export const reorder = mutation({
  args: {
    userId: v.string(),
    items: v.array(
      v.object({
        id: v.id("documents"),
        order: v.number(),
        parentDocument: v.optional(v.union(v.id("documents"), v.null())),
      })
    ),
    lastEditor: v.optional(v.string()),
    lastEditTime: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()

    if (!identity) {
      throw new Error("Not authenticated")
    }

    for (const item of args.items) {
      const existing = await ctx.db.get(item.id)

      if (!existing || existing.userId !== args.userId) {
        continue
      }

      if (item.parentDocument === null || item.parentDocument === undefined) {
        const { parentDocument: _, ...restDoc } = existing
        await ctx.db.replace(item.id, {
          ...restDoc,
          order: item.order,
          ...(args.lastEditor ? { lastEditor: args.lastEditor } : {}),
          ...(args.lastEditTime ? { lastEditTime: args.lastEditTime } : {}),
        })
      } else {
        await ctx.db.patch(item.id, {
          order: item.order,
          parentDocument: item.parentDocument,
          ...(args.lastEditor ? { lastEditor: args.lastEditor } : {}),
          ...(args.lastEditTime ? { lastEditTime: args.lastEditTime } : {}),
        })
      }
    }
  }
})

export const getArchiveSettings = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const identify = await ctx.auth.getUserIdentity()

    if (!identify) {
      return { retentionDays: 7 }
    }

    const settings = await ctx.db
      .query("archiveSettings")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first()

    return {
      retentionDays: settings?.retentionDays ?? 7,
    }
  },
})

export const setArchiveRetention = mutation({
  args: {
    userId: v.string(),
    retentionDays: v.number(),
    premiumLevel: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()

    if (!identity) {
      throw new Error("Not authenticated")
    }

    const validDays = [1, 7, 30, 90]
    if (!validDays.includes(args.retentionDays)) {
      throw new Error("Invalid retention days")
    }

    const premium = args.premiumLevel ?? 0
    if (args.retentionDays === 90 && premium < 2) {
      throw new Error("Diamond plan required for 90 days retention")
    }
    if (args.retentionDays === 30 && premium < 1) {
      throw new Error("Amber plan required for 30 days retention")
    }

    const existing = await ctx.db
      .query("archiveSettings")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first()

    if (existing) {
      await ctx.db.patch(existing._id, {
        retentionDays: args.retentionDays,
      })
    } else {
      await ctx.db.insert("archiveSettings", {
        userId: args.userId,
        retentionDays: args.retentionDays,
      })
    }

    const cutoff = Date.now() - args.retentionDays * 24 * 60 * 60 * 1000
    const archivedDocs = await ctx.db
      .query("documents")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("isAcrhived"), true))
      .collect()

    let cleaned = 0
    for (const doc of archivedDocs) {
      const docTime = doc.archivedTime
        ? new Date(doc.archivedTime).getTime()
        : (doc.lastEditTime ? new Date(doc.lastEditTime).getTime() : doc._creationTime)
      if (docTime <= cutoff) {
        await ctx.db.delete(doc._id)
        cleaned++
      }
    }

    return { success: true, retentionDays: args.retentionDays, cleaned }
  },
})

export const cleanExpiredTrash = mutation({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()

    if (!identity) {
      throw new Error("Not authenticated")
    }

    const settings = await ctx.db
      .query("archiveSettings")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first()

    const retentionDays = settings?.retentionDays ?? 7
    const cutoff = Date.now() - retentionDays * 24 * 60 * 60 * 1000

    const archivedDocs = await ctx.db
      .query("documents")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("isAcrhived"), true))
      .collect()

    let cleaned = 0
    for (const doc of archivedDocs) {
      const docTime = doc.archivedTime
        ? new Date(doc.archivedTime).getTime()
        : (doc.lastEditTime ? new Date(doc.lastEditTime).getTime() : doc._creationTime)
      if (docTime <= cutoff) {
        await ctx.db.delete(doc._id)
        cleaned++
      }
    }

    return { cleaned, retentionDays }
  },
})

export const move = mutation({
  args: {
    id: v.id("documents"),
    parentDocument: v.optional(v.union(v.id("documents"), v.null())),
    userId: v.string(),
    lastEditor: v.optional(v.string()),
    lastEditTime: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()

    if (!identity) {
      throw new Error("Not authenticated")
    }

    const existing = await ctx.db.get(args.id)

    if (!existing) {
      throw new Error("Document not found")
    }

    if (existing.userId !== args.userId) {
      throw new Error("Unauthorized")
    }

    const targetParentId = args.parentDocument ? args.parentDocument : undefined

    if (targetParentId === args.id) {
      throw new Error("Cannot move note into itself")
    }

    if (targetParentId) {
      let current: Id<"documents"> | undefined = targetParentId
      const visited = new Set<string>()
      while (current) {
        if (current === args.id) {
          throw new Error("Cannot move note into its descendant")
        }
        if (visited.has(current)) break
        visited.add(current)
        const pDoc: Doc<"documents"> | null = await ctx.db.get(current)
        current = pDoc?.parentDocument ? (pDoc.parentDocument as Id<"documents">) : undefined
      }
    }

    const siblings = await ctx.db
      .query("documents")
      .withIndex("by_user_parent", (q) =>
        q.eq("userId", args.userId).eq("parentDocument", targetParentId)
      )
      .filter((q) => q.eq(q.field("isAcrhived"), false))
      .collect()


    const validSiblings = siblings.filter((d) => d._id !== args.id)
    const newOrder = validSiblings.length

    if (!targetParentId) {
      const { parentDocument: _, ...restDoc } = existing
      await ctx.db.replace(args.id, {
        ...restDoc,
        order: newOrder,
        ...(args.lastEditor ? { lastEditor: args.lastEditor } : {}),
        ...(args.lastEditTime ? { lastEditTime: args.lastEditTime } : {}),
      })
    } else {
      await ctx.db.patch(args.id, {
        parentDocument: targetParentId,
        order: newOrder,
        ...(args.lastEditor ? { lastEditor: args.lastEditor } : {}),
        ...(args.lastEditTime ? { lastEditTime: args.lastEditTime } : {}),
      })
    }

    return args.id
  },
})

