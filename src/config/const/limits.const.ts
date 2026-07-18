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