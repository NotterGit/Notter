import { AMBER_PERSONAL_LIMITS, AMBER_TEAM_LIMITS, DIAMOND_LIMITS, FREE_LIMITS, PlanLimits, PremiumLevel } from "@/config/const/limits.const"

export const getPlanLimits = (premiumLevel: PremiumLevel = 0, isOrg = false): PlanLimits => {
    if (premiumLevel === 1) {
        return isOrg ? AMBER_TEAM_LIMITS : AMBER_PERSONAL_LIMITS
    }

    if (premiumLevel === 2) {
        return DIAMOND_LIMITS
    }

    return FREE_LIMITS
}

export const getDocumentLimit = (premiumLevel?: PremiumLevel, isOrg?: boolean) => {
    return getPlanLimits(premiumLevel, isOrg).documents
}

export const getPublicDocumentLimit = (premiumLevel?: PremiumLevel, isOrg?: boolean) => {
    return getPlanLimits(premiumLevel, isOrg).publicDocuments
}

export const getPlanLimitsByTier = (isOrg = false) => ({
    free: FREE_LIMITS,
    amber: isOrg ? AMBER_TEAM_LIMITS : AMBER_PERSONAL_LIMITS,
    diamond: DIAMOND_LIMITS,
})

export const getMaxArchiveRetentionDays = (premiumLevel: PremiumLevel = 0): number => {
    if (premiumLevel >= 2) return 90
    if (premiumLevel === 1) return 30
    return 7
}

export const isArchiveRetentionAllowed = (days: number, premiumLevel: PremiumLevel = 0): boolean => {
    return days <= getMaxArchiveRetentionDays(premiumLevel)
}

