export type PremiumLevel = 0 | 1 | 2 | number

export type PlanLimits = {
  documents: number
  publicDocuments: number
  uploadMb: number
  aiGenerationsPerWeek: number
  aiGenerationsPerDay?: number
}

export type ArchiveRetentionDays = 1 | 7 | 30 | 90

export type ArchiveRetentionOption = {
  days: ArchiveRetentionDays
  label: string
  requiredPremium: number
  gemName?: string
}
