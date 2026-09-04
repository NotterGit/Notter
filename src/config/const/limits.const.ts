export type PremiumLevel = 0 | 1 | 2 | number

export type PlanLimits = {
    documents: number
    publicDocuments: number
    uploadMb: number
}

export const FREE_LIMITS: PlanLimits = {
    documents: 75,
    publicDocuments: 10,
    uploadMb: 1,
}

export const AMBER_PERSONAL_LIMITS: PlanLimits = {
    documents: 200,
    publicDocuments: 100,
    uploadMb: 3,
}

export const AMBER_TEAM_LIMITS: PlanLimits = {
    documents: 500,
    publicDocuments: 250,
    uploadMb: 3,
}

export const DIAMOND_LIMITS: PlanLimits = {
    documents: 1000,
    publicDocuments: 1000,
    uploadMb: 10,
}

export type ArchiveRetentionDays = 1 | 7 | 30 | 90

export const DEFAULT_RETENTION_DAYS: ArchiveRetentionDays = 7

export type ArchiveRetentionOption = {
    days: ArchiveRetentionDays
    label: string
    requiredPremium: number
    gemName?: string
}

export const ARCHIVE_RETENTION_OPTIONS: ArchiveRetentionOption[] = [
    { days: 1, label: "1 день", requiredPremium: 0 },
    { days: 7, label: "7 дней", requiredPremium: 0 },
    { days: 30, label: "30 дней", requiredPremium: 1, gemName: "Amber" },
    { days: 90, label: "90 дней", requiredPremium: 2, gemName: "Diamond" },
]