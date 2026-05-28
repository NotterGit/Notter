import { createProfileApi } from "../profile-api"
import { apiRoutes } from "@/config/routing/api.route"
import type {
  CreateOrgFunction,
  Org,
  ProfileGetByIdFunction,
  ProfileGetByUsernameFunction,
  UpdateBadgeFunction,
  UpdateOrgFunction,
} from "@/config/types/api.types"

const orgsApi = createProfileApi<Org>(apiRoutes.ORGS)

export const createOrg: CreateOrgFunction = (
  _id,
  username,
  owner,
  created = null,
  name = null,
  members = null,
  avatar = null,
  documents = null,
  publicDocuments = null,
  verifiedDocuments = null
) => {
  return orgsApi.create(_id, {
    username,
    owner,
    created,
    members,
    name,
    avatar,
    documents,
    publicDocuments,
    verifiedDocuments,
  })
}

export const getByUsername: ProfileGetByUsernameFunction<Org> = orgsApi.getByUsername
export const getById: ProfileGetByIdFunction<Org> = orgsApi.getById

export const updateOrg: UpdateOrgFunction = (
  _id,
  username = null,
  owner = null,
  name = null,
  avatar = null,
  privated = null,
  pined = null,
  documents = null,
  publicDocuments = null,
  members = null,
  watermark = null,
  premium = null,
  verifiedDocuments = null
) => {
  return orgsApi.update(_id, {
    username,
    name,
    owner,
    avatar,
    privated,
    pined,
    documents,
    members,
    publicDocuments,
    watermark,
    premium,
    verifiedDocuments,
  })
}

export const updateOrgBadge: UpdateBadgeFunction = orgsApi.updateBadge
