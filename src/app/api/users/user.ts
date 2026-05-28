import { apiPut } from "../client"
import { createProfileApi } from "../profile-api"
import { apiRoutes } from "@/config/routing/api.route"
import type {
  ChangeVerifiedOrgsFunction,
  CreateUserFunction,
  MessageResponse,
  ProfileGetByIdFunction,
  ProfileGetByUsernameFunction,
  UpdateBadgeFunction,
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
  mail = null,
  premium = null,
  moderator = null
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
    premium,
    moderator,
  })
}

export const updateUserBadge: UpdateBadgeFunction = usersApi.updateBadge

export const changeVerifiedOrgs: ChangeVerifiedOrgsFunction = (_id, change) => {
  return apiPut<MessageResponse>(apiRoutes.USERS.CHANGE_VERIFIED_ORGS(_id), { change })
}
