import axios from "axios";

export const API_BASE_URL = process.env.NEXT_PUBLIC_QUALSU_API
export const API_TIMEOUT = 10000;

export const S3_BASE_URL =
  process.env.NEXT_PUBLIC_S3_SERVICE;
export const S3_TIMEOUT = 30000;

export const API_URL = API_BASE_URL;
export const S3_URL = S3_BASE_URL;

export const API = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
});

export const S3 = axios.create({
  baseURL: S3_BASE_URL,
  timeout: S3_TIMEOUT,
});