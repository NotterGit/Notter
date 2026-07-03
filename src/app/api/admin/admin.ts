import { apiPut } from "../client"
import { apiRoutes } from "@/config/routing/api.route"
import type {
  AdminUpdateResponse,
  ChangeVerifiedOrgsFunction,
  SetModeratorFunction,
  SetPremiumFunction,
  UpdateBadgeFunction,
} from "@/config/types/api.types"

export const setUserPremium: SetPremiumFunction = (_id, premium) => {
  return apiPut<AdminUpdateResponse>(apiRoutes.ADMIN.USERS.PREMIUM(_id), { premium })
}

export const setUserModerator: SetModeratorFunction = (_id, moderator) => {
  return apiPut<AdminUpdateResponse>(apiRoutes.ADMIN.USERS.MODERATOR(_id), { moderator })
}

export const updateUserBadge: UpdateBadgeFunction = (_id, badge_name, status) => {
  return apiPut<AdminUpdateResponse>(apiRoutes.ADMIN.USERS.BADGE(_id), { badge_name, status })
}

export const changeUserVerifiedOrgs: ChangeVerifiedOrgsFunction = (_id, change) => {
  return apiPut<AdminUpdateResponse>(apiRoutes.ADMIN.USERS.VERIFIED_ORGS(_id), { change })
}

export const setOrgPremium: SetPremiumFunction = (_id, premium) => {
  return apiPut<AdminUpdateResponse>(apiRoutes.ADMIN.ORGS.PREMIUM(_id), { premium })
}

export const updateOrgBadge: UpdateBadgeFunction = (_id, badge_name, status) => {
  return apiPut<AdminUpdateResponse>(apiRoutes.ADMIN.ORGS.BADGE(_id), { badge_name, status })
}
