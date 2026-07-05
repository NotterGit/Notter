import { apiGet } from "../client"
import { createProfileApi } from "../profile-api"
import { apiRoutes } from "@/config/routing/api.route"
import type {
  CreateUserFunction,
  ProfileGetByIdFunction,
  ProfileGetByUsernameFunction,
  UpdateUserFunction,
  User,
} from "@/config/types/api.types"

const usersApi = createProfileApi<User>(apiRoutes.USERS)

export const createUser: CreateUserFunction = (
  _id,
  username,
  created = null,
  firstname = null,
  lastname = null,
  avatar = null,
  documents = null,
  publicDocuments = null,
  verifiedDocuments = null,
  mail = null
) => {
  return usersApi.create(_id, {
    username,
    created,
    firstname,
    lastname,
    avatar,
    documents,
    publicDocuments,
    verifiedDocuments,
    mail,
  })
}

export const getByUsername: ProfileGetByUsernameFunction<User> = usersApi.getByUsername
export const getById: ProfileGetByIdFunction<User> = usersApi.getById

export const updateUser: UpdateUserFunction = (
  _id,
  username = null,
  firstname = null,
  lastname = null,
  avatar = null,
  privated = null,
  pined = null,
  documents = null,
  publicDocuments = null,
  verifiedDocuments = null,
  watermark = null,
  mail = null
) => {
  return usersApi.update(_id, {
    username,
    firstname,
    lastname,
    avatar,
    privated,
    pined,
    documents,
    publicDocuments,
    verifiedDocuments,
    watermark,
    mail,
  })
}

export const checkModerator = async (_id: string): Promise<boolean> => {
  const data = await apiGet<{ moderator: boolean }>(apiRoutes.USERS.MODERATOR(_id))
  if (!data) {
    console.error(`[checkModerator] Failed to fetch moderator status for ${_id}`)
  }
  return data?.moderator ?? false
}
