export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE"

export type ApiRequestOptions = {
  data?: unknown
  headers?: Record<string, string>
}

export type MessageResponse = {
  message: string
}

export type ApiRequestFunction = <T>(
  method: HttpMethod,
  url: string,
  options?: ApiRequestOptions
) => Promise<T | null>

export type ApiGetFunction = <T>(url: string) => Promise<T | null>

export type ApiPostFunction = <T>(
  url: string,
  data?: unknown,
  options?: ApiRequestOptions
) => Promise<T | null>

export type ApiPutFunction = <T>(url: string, data?: unknown) => Promise<T | null>

export type ApiDeleteFunction = <T>(url: string, data?: unknown) => Promise<T | null>

export type RemoveNullishFunction = <T extends Record<string, unknown>>(payload: T) => Partial<T>

export type WithApiBaseUrlFunction = (path: string) => string

export type ProfileRoutes = {
  ADD: (_id: string) => string
  BY_USERNAME: (username: string) => string
  BY_ID: (_id: string) => string
  UPDATE: (_id: string) => string
  UPDATE_BADGE: (_id: string) => string
}

export type ProfileApi<TProfile> = {
  create: (_id: string, payload: Record<string, unknown>) => Promise<TProfile | null>
  getByUsername: (username: string) => Promise<TProfile | null>
  getById: (_id: string) => Promise<TProfile | null>
  update: (_id: string, payload: Record<string, unknown>) => Promise<TProfile | null>
  updateBadge: (_id: string, badgeName: string, status: boolean) => Promise<MessageResponse | null>
}

export type ProfileGetByUsernameFunction<TProfile> = ProfileApi<TProfile>["getByUsername"]

export type ProfileGetByIdFunction<TProfile> = ProfileApi<TProfile>["getById"]

export interface Order {
  _id: string
  userid: string
  premium: number
  status: string
  amount: number
}

export type CreateOrderFunction = (
  _id: string,
  userid?: string | null,
  premium?: number | null,
  status?: string | null,
  amount?: number | null
) => Promise<Order | null>

export type CheckOrderFunction = (_id: string) => Promise<Order | null>

export type SuccessOrderFunction = (_id: string) => Promise<Order | null>

export type UploadFileResponse = {
  url: string
}

export type DeleteFileResponse = {
  success: boolean
}

export type UploadFileFunction = (
  userid: string,
  documentid: string,
  avatar: string,
  username: string,
  file: File
) => Promise<string | null>

export type DeleteFileFunction = (userid: string, fileid: string) => Promise<boolean>

export type OrgBadge = {
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

export type UserBadge = {
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
}

export type CreateUserFunction = (
  _id: string,
  username: string,
  created?: Date | null,
  firstname?: string | null,
  lastname?: string | null,
  avatar?: string | null,
  documents?: number | null,
  publicDocuments?: number | null,
  verifiedDocuments?: number | null,
  mail?: string | null
) => Promise<User | null>

export type UpdateUserFunction = (
  _id: string,
  username?: string | null,
  firstname?: string | null,
  lastname?: string | null,
  avatar?: string | null,
  privated?: boolean | null,
  pined?: string | null,
  documents?: number | null,
  publicDocuments?: number | null,
  verifiedDocuments?: number | null,
  watermark?: boolean | null,
  mail?: string | null,
  premium?: number | null,
  moderator?: boolean | null
) => Promise<User | null>

export type ChangeVerifiedOrgsFunction = (_id: string, change: number) => Promise<MessageResponse | null>

export type CreateOrgFunction = (
  _id: string,
  username: string | null,
  owner: string | null,
  created?: Date | null,
  name?: string | null,
  members?: string[] | null,
  avatar?: string | null,
  documents?: number | null,
  publicDocuments?: number | null,
  verifiedDocuments?: number | null
) => Promise<Org | null>

export type UpdateOrgFunction = (
  _id: string,
  username?: string | null,
  owner?: string | null,
  name?: string | null,
  avatar?: string | null,
  privated?: boolean | null,
  pined?: string | null,
  documents?: number | null,
  publicDocuments?: number | null,
  members?: string[] | null,
  watermark?: boolean | null,
  premium?: number | null,
  verifiedDocuments?: number | null
) => Promise<Org | null>

export type UpdateBadgeFunction = (
  _id: string,
  badgeName: string,
  status: boolean
) => Promise<MessageResponse | null>

export type DocumentStats = {
  documentCount: number | null | undefined
  documentPublicCount: number | null | undefined
  documentVerifiedCount: number | null | undefined
  isReady: boolean
}

export type UseDocumentStatsFunction = (userId?: string | null) => DocumentStats

export type UseRequestUserFunction = () => null

export type UseRequestOrgFunction = () => null
