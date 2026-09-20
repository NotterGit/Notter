import { Get, Post, Put } from "@/api/client";
import { API } from "@/config/routing/api.route";
import type {
  CreateOrgPayload,
  Org,
  UpdateOrgPayload,
} from "@/config/types/api.types";

export const getOrgById = async (_id: string): Promise<Org | null> => {
  return Get<Org>(API.BACKEND.ORGS.BY_ID(_id));
};

export const getOrgByUsername = async (
  username: string
): Promise<Org | null> => {
  return Get<Org>(API.BACKEND.ORGS.BY_USERNAME(username));
};

export async function createOrg(
  _id: string,
  payload: CreateOrgPayload
): Promise<Org | null>;
export async function createOrg(
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
): Promise<Org | null>;
export async function createOrg(
  _id: string,
  payloadOrUsername: CreateOrgPayload | string | null,
  owner?: string | null,
  created?: Date | null,
  name?: string | null,
  members?: string[] | null,
  avatar?: string | null,
  documents?: number | null,
  publicDocuments?: number | null,
  verifiedDocuments?: number | null
): Promise<Org | null> {
  const payload: CreateOrgPayload =
    payloadOrUsername && typeof payloadOrUsername === "object"
      ? payloadOrUsername
      : {
          username: payloadOrUsername,
          owner: owner ?? null,
          created,
          name,
          members,
          avatar,
          documents,
          publicDocuments,
          verifiedDocuments,
        };

  return Post<Org>(API.BACKEND.ORGS.ADD(_id), payload);
}

export async function updateOrg(
  _id: string,
  payload: UpdateOrgPayload
): Promise<boolean>;
export async function updateOrg(
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
  verifiedDocuments?: number | null
): Promise<boolean>;
export async function updateOrg(
  _id: string,
  payloadOrUsername?: UpdateOrgPayload | string | null,
  owner?: string | null,
  name?: string | null,
  avatar?: string | null,
  privated?: boolean | null,
  pined?: string | null,
  documents?: number | null,
  publicDocuments?: number | null,
  members?: string[] | null,
  watermark?: boolean | null,
  verifiedDocuments?: number | null
): Promise<boolean> {
  const payload: UpdateOrgPayload =
    payloadOrUsername && typeof payloadOrUsername === "object"
      ? payloadOrUsername
      : {
          username:
            typeof payloadOrUsername === "string" ? payloadOrUsername : undefined,
          owner,
          name,
          avatar,
          privated,
          pined,
          documents,
          publicDocuments,
          members,
          watermark,
          verifiedDocuments,
        };

  const result = await Put<{ updated: boolean }>(
    API.BACKEND.ORGS.UPDATE(_id),
    payload
  );
  return Boolean(result?.updated);
}

// Aliases for compatibility
export const getById = getOrgById;
export const getByUsername = getOrgByUsername;
