export const APP_VERSION = "0.8.0";
export const BETA_HOSTS = ["dev.notter.su", "localhost:3001"];

export const DESKTOP_QUERY_PARAM = "desktop";
export const DESKTOP_COOKIE = "desktop";
export const DESKTOP_STORAGE_KEY = "desktop";
export const REDIRECT_COOKIE = "redirect";

export const isDevEnvironment = (): boolean => {
  if (process.env.NODE_ENV !== "production") return true;
  if (typeof window !== "undefined") {
    const host = window.location.host;
    if (host.includes("localhost") || host.includes("127.0.0.1") || host.includes("dev.")) {
      return true;
    }
    if (window.location.search.includes("dev=true")) {
      return true;
    }
  }
  return false;
};

