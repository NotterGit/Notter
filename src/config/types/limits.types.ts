export type PremiumLevel = 0 | 1 | 2 | number

export type PlanLimits = {
  name?: "Free" | "Amber" | "Diamond"
  documents: number
  publicDocuments: number
  uploadMb: number
  aiGenerationsPerWeek: number
  aiGenerationsPerDay?: number
  hasExtendedAuditLog?: boolean
  hasAuditLogExport?: boolean
}

export type ArchiveRetentionDays = 1 | 7 | 30 | 90

export type ArchiveRetentionOption = {
  days: ArchiveRetentionDays
  label: string
  requiredPremium: number
  gemName?: string
}
