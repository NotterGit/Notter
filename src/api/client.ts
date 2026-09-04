import {
  API_BASE_URL,
  API_TIMEOUT,
  S3_BASE_URL,
  S3_TIMEOUT,
} from "@/config/const/api.const";
import axios, { AxiosRequestConfig, isAxiosError } from "axios";

let clerkTokenGetter: (() => Promise<string | null>) | null = null;

export const setClerkTokenGetter = (
  getter: (() => Promise<string | null>) | null
) => {
  clerkTokenGetter = getter;
};

export const getClerkToken = async (): Promise<string | null> => {
  if (!clerkTokenGetter) return null;
  try {
    return await clerkTokenGetter();
  } catch {
    return null;
  }
};

export const normalizePath = (path: string): string => {
  return path.replace(/^\/+/, "");
};

export const Client = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
});

export const S3Client = axios.create({
  baseURL: S3_BASE_URL,
  timeout: S3_TIMEOUT,
});

const attachClerkToken = (instance: typeof Client) => {
  instance.interceptors.request.use(async (config) => {
    if (!clerkTokenGetter) {
      return config;
    }
    if (config.headers && config.headers.Authorization) {
      return config;
    }
    try {
      const token = await clerkTokenGetter();
      if (token) {
        if (config.headers?.set) {
          config.headers.set("Authorization", `Bearer ${token}`);
        } else {
          config.headers = config.headers || {};
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
    } catch {
    }
    return config;
  });
};

attachClerkToken(Client);
attachClerkToken(S3Client);

export const removeNullish = <T extends Record<string, unknown>>(
  payload: T
): Partial<T> => {
  return Object.fromEntries(
    Object.entries(payload).filter(
      ([, value]) => value !== null && value !== undefined
    )
  ) as Partial<T>;
};

export const Get = async <T>(
  url: string,
  config?: AxiosRequestConfig
): Promise<T | null> => {
  try {
    const res = await Client.get<T>(normalizePath(url), config);
    return res.data;
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 404) {
      return null;
    }
    console.error(`[API] GET ${url} failed:`, error);
    return null;
  }
};

export const Post = async <T>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig
): Promise<T | null> => {
  try {
    const payload =
      data && typeof data === "object" && !(data instanceof FormData)
        ? removeNullish(data as Record<string, unknown>)
        : data;
    const res = await Client.post<T>(normalizePath(url), payload, config);
    return res.data;
  } catch (error) {
    console.error(`[API] POST ${url} failed:`, error);
    return null;
  }
};

export const Put = async <T>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig
): Promise<T | null> => {
  try {
    const payload =
      data && typeof data === "object" && !(data instanceof FormData)
        ? removeNullish(data as Record<string, unknown>)
        : data;
    const res = await Client.put<T>(normalizePath(url), payload, config);
    return res.data;
  } catch (error) {
    console.error(`[API] PUT ${url} failed:`, error);
    return null;
  }
};

export const Delete = async <T>(
  url: string,
  config?: AxiosRequestConfig
): Promise<T | null> => {
  try {
    const res = await Client.delete<T>(normalizePath(url), config);
    return res.data;
  } catch (error) {
    console.error(`[API] DELETE ${url} failed:`, error);
    return null;
  }
};

// Aliases for full compatibility
export const apiGet = Get;
export const apiPost = Post;
export const apiPut = Put;
export const apiDelete = Delete;
export const API = Client;
export const S3 = S3Client;
