import axios from "axios";

export const API_URL = process.env.NEXT_PUBLIC_QUALSU_API;
export const S3_URL = process.env.NEXT_PUBLIC_S3_SERVICE;

export const API = axios.create({
    baseURL: API_URL,
    timeout: 10000,
})

export const S3 = axios.create({
    baseURL: S3_URL,
    timeout: 30000,
})