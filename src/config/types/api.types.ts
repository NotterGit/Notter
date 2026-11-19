export type ApiEntityResponse = Record<string, unknown>

export type S3UploadResponse = {
  filename: string
  key: string
  url: string
}

export interface S3DeleteResponse {
  deleted: boolean
}

export type ArchivedSettings = {
  retentionDays: number;
}

export interface CreateUserPayload {
  username: string
  created?: Date | string | null
  firstname?: string | null
  lastname?: string | null
  avatar?: string | null
  documents?: number | null
  publicDocuments?: number | null
  verifiedDocuments?: number | null
  mail?: string | null
  archived_settings?: ArchivedSettings | null
}

export interface UpdateUserPayload {
  username?: string | null
  firstname?: string | null
  lastname?: string | null
  avatar?: string | null
  privated?: boolean | null
  pined?: string | null
  documents?: number | null
  publicDocuments?: number | null
  verifiedDocuments?: number | null
  watermark?: boolean | null
  mail?: string | null
  archived_settings?: ArchivedSettings | null
}

export interface CreateOrgPayload {
  username: string | null
  owner: string | null
  created?: Date | string | null
  name?: string | null
  members?: string[] | null
  avatar?: string | null
  documents?: number | null
  publicDocuments?: number | null
  verifiedDocuments?: number | null
}

export interface UpdateOrgPayload {
  username?: string | null
  owner?: string | null
  name?: string | null
  avatar?: string | null
  privated?: boolean | null
  pined?: string | null
  documents?: number | null
  publicDocuments?: number | null
  members?: string[] | null
  watermark?: boolean | null
  verifiedDocuments?: number | null
}

export type UploadFileFunction = (
  userid: string,
  documentid: string,
  avatar: string,
  username: string,
  file: File
) => Promise<string | null>

export type DeleteFileFunction = (userid: string, url: string) => Promise<boolean>

type OrgBadge = {
  verified: boolean;
  notes_verifed: boolean;
  contributor: boolean;
  notter: boolean;
  org_verifed: boolean;
}

export type Org = {
  _id: string;
  username: string;
  owner: string;
  name: string | null;
  firstname: string;
  lastname: string | null;
  members: Array<string>;
  avatar: string | null;
  badges: OrgBadge;
  privated: boolean;
  pined: string | null;
  created: Date | null;
  premium: number;
  documents: number;
  publicDocuments: number;
  verifiedDocuments: number;
  verifiedOrgs: number;
  moderator: boolean;
  watermark: boolean;
  mail: string | null;
}

type UserBadge = {
  verified: boolean;
  notes_verifed: boolean;
  contributor: boolean;
  notter: boolean;
  org_verifed: boolean;
}

export type User = {
  _id: string;
  username: string;
  name: string;
  firstname: string;
  lastname: string | null;
  avatar: string | null;
  badges: UserBadge;
  privated: boolean;
  pined: string | null;
  created: Date | null;
  premium: number;
  moderator: boolean;
  documents: number;
  publicDocuments: number;
  verifiedDocuments: number;
  verifiedOrgs: number;
  watermark: boolean | null;
  owner: string;
  members: Array<string>;
  mail: string | null;
  archived_settings?: ArchivedSettings;
}

type DocumentStats = {
  documentCount: number | null | undefined
  documentPublicCount: number | null | undefined
  documentVerifiedCount: number | null | undefined
  isReady: boolean
}

export type UseDocumentStatsFunction = (userId?: string | null) => DocumentStats

export type UseRequestUserFunction = () => null

export type UseRequestOrgFunction = () => null

export type AdminUpdateResponse = {
  updated: boolean
}

export type SetPremiumFunction = (
  _id: string,
  premium: number,
  notify?: boolean
) => Promise<AdminUpdateResponse | null>

export type SetModeratorFunction = (
  _id: string,
  moderator: boolean,
  notify?: boolean
) => Promise<AdminUpdateResponse | null>

export type UpdateBadgeFunction = (
  _id: string,
  badge_name: string,
  status: boolean,
  notify?: boolean
) => Promise<AdminUpdateResponse | null>

export type ChangeVerifiedOrgsFunction = (
  _id: string,
  change: number,
  notify?: boolean
) => Promise<AdminUpdateResponse | null>
