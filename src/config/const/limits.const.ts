import type {
  PremiumLevel,
  PlanLimits,
  ArchiveRetentionDays,
  ArchiveRetentionOption,
} from "@/config/types/limits.types"

export type {
  PremiumLevel,
  PlanLimits,
  ArchiveRetentionDays,
  ArchiveRetentionOption,
}

export const AUDIT_LOG_LIMIT = 3;
export const FREE_AUDIT_LOG_LIMIT = 20;
export const EXTENDED_AUDIT_LOG_LIMIT = 200;
export const FREE_NOTE_AUDIT_LOG_LIMIT = 3;
export const EXTENDED_NOTE_AUDIT_LOG_LIMIT = 50;

export const hasExtendedAuditLog = (premium?: number | null): boolean => {
  return premium === 1 || premium === 2;
};

export const isDiamondPlan = (premium?: number | null): boolean => {
  return premium === 2;
};

export const FREE_LIMITS: PlanLimits = {
    name: "Free",
    documents: 50,
    publicDocuments: 10,
    uploadMb: 1,
    aiGenerationsPerWeek: 10,
    aiGenerationsPerDay: 10,
    hasExtendedAuditLog: false,
    hasAuditLogExport: false,
}

export const AMBER_PERSONAL_LIMITS: PlanLimits = {
    name: "Amber",
    documents: 200,
    publicDocuments: 100,
    uploadMb: 3,
    aiGenerationsPerWeek: 50,
    aiGenerationsPerDay: 50,
    hasExtendedAuditLog: true,
    hasAuditLogExport: false,
}

export const AMBER_TEAM_LIMITS: PlanLimits = {
    name: "Amber",
    documents: 500,
    publicDocuments: 250,
    uploadMb: 3,
    aiGenerationsPerWeek: 100,
    aiGenerationsPerDay: 100,
    hasExtendedAuditLog: true,
    hasAuditLogExport: false,
}

export const DIAMOND_LIMITS: PlanLimits = {
    name: "Diamond",
    documents: 1000,
    publicDocuments: 1000,
    uploadMb: 10,
    aiGenerationsPerWeek: 250,
    aiGenerationsPerDay: 250,
    hasExtendedAuditLog: true,
    hasAuditLogExport: true,
}

export const DEFAULT_RETENTION_DAYS: ArchiveRetentionDays = 7

export const ARCHIVE_RETENTION_OPTIONS: ArchiveRetentionOption[] = [
    { days: 1, label: "1 день", requiredPremium: 0 },
    { days: 7, label: "7 дней", requiredPremium: 0 },
    { days: 30, label: "30 дней", requiredPremium: 1, gemName: "Amber" },
    { days: 90, label: "90 дней", requiredPremium: 2, gemName: "Diamond" },
]