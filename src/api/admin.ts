import { Put } from "@/api/client";
import { API } from "@/config/routing/api.route";
import type {
  AdminUpdateResponse,
  ChangeVerifiedOrgsFunction,
  SetModeratorFunction,
  SetPremiumFunction,
  UpdateBadgeFunction,
} from "@/config/types/api.types";

export const setUserPremium: SetPremiumFunction = (_id, premium, notify = true) => {
  return Put<AdminUpdateResponse>(API.BACKEND.ADMIN.USERS.PREMIUM(_id), {
    premium,
    notify,
  });
};

export const setUserModerator: SetModeratorFunction = (
  _id,
  moderator,
  notify = true
) => {
  return Put<AdminUpdateResponse>(API.BACKEND.ADMIN.USERS.MODERATOR(_id), {
    moderator,
    notify,
  });
};

export const updateUserBadge: UpdateBadgeFunction = (
  _id,
  badge_name,
  status,
  notify = true
) => {
  return Put<AdminUpdateResponse>(API.BACKEND.ADMIN.USERS.BADGE(_id), {
    badge_name,
    status,
    notify,
  });
};

export const changeUserVerifiedOrgs: ChangeVerifiedOrgsFunction = (
  _id,
  change,
  notify = true
) => {
  return Put<AdminUpdateResponse>(API.BACKEND.ADMIN.USERS.VERIFIED_ORGS(_id), {
    change,
    notify,
  });
};

export const setOrgPremium: SetPremiumFunction = (_id, premium, notify = true) => {
  return Put<AdminUpdateResponse>(API.BACKEND.ADMIN.ORGS.PREMIUM(_id), {
    premium,
    notify,
  });
};

export const updateOrgBadge: UpdateBadgeFunction = (
  _id,
  badge_name,
  status,
  notify = true
) => {
  return Put<AdminUpdateResponse>(API.BACKEND.ADMIN.ORGS.BADGE(_id), {
    badge_name,
    status,
    notify,
  });
};
