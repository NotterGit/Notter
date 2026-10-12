export const API_BASE_URL = process.env.NEXT_PUBLIC_QUALSU_API;
export const API_TIMEOUT = 10000;

export const S3_BASE_URL = process.env.NEXT_PUBLIC_S3_SERVICE;
export const S3_TIMEOUT = 30000;

export const QUALAI_API_URL = (
  process.env.QUALAI_API_URL || "http://localhost:8010"
).replace(/\/+$/, "");