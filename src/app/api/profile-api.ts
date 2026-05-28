import { apiGet, apiPost, apiPut, removeNullish } from "./client"
import type { MessageResponse, ProfileApi, ProfileRoutes } from "@/config/types/api.types"

export function createProfileApi<TProfile>(routes: ProfileRoutes): ProfileApi<TProfile> {
  return {
    create(_id: string, payload: Record<string, unknown>) {
      return apiPost<TProfile>(routes.ADD(_id), removeNullish(payload))
    },

    getByUsername(username: string) {
      return apiGet<TProfile>(routes.BY_USERNAME(username))
    },

    getById(_id: string) {
      return apiGet<TProfile>(routes.BY_ID(_id))
    },

    update(_id: string, payload: Record<string, unknown>) {
      return apiPut<TProfile>(routes.UPDATE(_id), removeNullish(payload))
    },

    updateBadge(_id: string, badgeName: string, status: boolean) {
      return apiPut<MessageResponse>(routes.UPDATE_BADGE(_id), {
        badge_name: badgeName,
        status,
      })
    },
  }
}
