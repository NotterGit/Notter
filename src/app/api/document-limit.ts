import { getById as getOrgById } from "./orgs/org"
import { getById as getUserById } from "./users/user"
import { getDocumentLimit } from "../../lib/plan-limits"
import { Id } from "../../../convex/_generated/dataModel"
import { FREE_LIMITS } from "../../config/const/limits.const"

export { getDocumentLimit }

export const getCreateDocumentErrorMessage = (error: unknown) => {
    const message = error instanceof Error ? error.message : ""

    if (message.includes("Rate limit exceeded")) {
        return "Вы превысили лимит на создание документов. Попробуйте позже"
    }

    if (message.includes("Rate limited note")) {
        const [, rawLimit] = message.split(":")
        const documentLimit = Number(rawLimit) || FREE_LIMITS.documents

        return `Вы достигли лимита на создание в ${documentLimit} заметок`
    }

    return "Не удалось создать заметку"
}

export const getCreateDocumentLimitOptions = async (userId: string, isOrg: boolean) => {
    const profile = isOrg ? await getOrgById(userId) : await getUserById(userId)

    return {
        premiumLevel: profile?.premium ?? 0,
        isOrg,
    }
}

type CreateDocumentArgs = {
    title: string
    userId: string
    lastEditor: string
    creatorName: string
    lastEditTime?: string
    parentDocument?: Id<"documents">
    premiumLevel?: number
    isOrg?: boolean
}

type CreateDocumentMutation = (args: CreateDocumentArgs) => Promise<Id<"documents">>

const isLegacyCreateValidationError = (error: unknown) => {
    const message = error instanceof Error ? error.message : ""

    return message.includes("ArgumentValidationError")
        && (message.includes("extra field `isOrg`") || message.includes("extra field `premiumLevel`"))
}

export const createDocumentWithFallback = async (
    create: CreateDocumentMutation,
    args: CreateDocumentArgs
) => {
    try {
        return await create(args)
    } catch (error) {
        if (!isLegacyCreateValidationError(error)) {
            throw error
        }

        const { premiumLevel: _premiumLevel, isOrg: _isOrg, ...legacyArgs } = args

        return create(legacyArgs)
    }
}
