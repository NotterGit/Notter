import { Get, Post, Put } from "@/api/client";
import { API } from "@/config/routing/api.route";
import type {
  CreateUserPayload,
  UpdateUserPayload,
  User,
} from "@/config/types/api.types";

export const getUserById = async (_id: string): Promise<User | null> => {
  return Get<User>(API.BACKEND.USERS.BY_ID(_id));
};

export const getUserByUsername = async (
  username: string
): Promise<User | null> => {
  return Get<User>(API.BACKEND.USERS.BY_USERNAME(username));
};

export async function createUser(
  _id: string,
  payload: CreateUserPayload
): Promise<User | null>;
export async function createUser(
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
): Promise<User | null>;
export async function createUser(
  _id: string,
  payloadOrUsername: CreateUserPayload | string,
  created?: Date | null,
  firstname?: string | null,
  lastname?: string | null,
  avatar?: string | null,
  documents?: number | null,
  publicDocuments?: number | null,
  verifiedDocuments?: number | null,
  mail?: string | null
): Promise<User | null> {
  const payload: CreateUserPayload =
    typeof payloadOrUsername === "string"
      ? {
          username: payloadOrUsername,
          created,
          firstname,
          lastname,
          avatar,
          documents,
          publicDocuments,
          verifiedDocuments,
          mail,
        }
      : payloadOrUsername;

  return Post<User>(API.BACKEND.USERS.ADD(_id), payload);
}

export async function updateUser(
  _id: string,
  payload: UpdateUserPayload
): Promise<boolean>;
export async function updateUser(
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
  mail?: string | null
): Promise<boolean>;
export async function updateUser(
  _id: string,
  payloadOrUsername?: UpdateUserPayload | string | null,
  firstname?: string | null,
  lastname?: string | null,
  avatar?: string | null,
  privated?: boolean | null,
  pined?: string | null,
  documents?: number | null,
  publicDocuments?: number | null,
  verifiedDocuments?: number | null,
  watermark?: boolean | null,
  mail?: string | null
): Promise<boolean> {
  const payload: UpdateUserPayload =
    payloadOrUsername && typeof payloadOrUsername === "object"
      ? payloadOrUsername
      : {
          username:
            typeof payloadOrUsername === "string" ? payloadOrUsername : undefined,
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
        };

  const result = await Put<{ updated: boolean }>(
    API.BACKEND.USERS.UPDATE(_id),
    payload
  );
  return Boolean(result?.updated);
}

export const checkModerator = async (_id: string): Promise<boolean> => {
  const data = await Get<{ moderator: boolean }>(
    API.BACKEND.USERS.MODERATOR(_id)
  );
  if (!data) {
    console.error(`[checkModerator] Failed to fetch moderator status for ${_id}`);
  }
  return data?.moderator ?? false;
};

// Aliases for compatibility
export const getById = getUserById;
export const getByUsername = getUserByUsername;
