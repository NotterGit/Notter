export const API = {
  DOCUMENTS: {
    SIDEBAR: (
      options?:
        | string
        | {
            userId?: string;
            parentDocument?: string | null;
            publicSorted?: boolean;
          }
    ) => {
      if (typeof options === "string") {
        return `/api/documents/sidebar?userId=${encodeURIComponent(options)}`;
      }
      const params = new URLSearchParams();
      if (options?.userId) params.set("userId", options.userId);
      if (options?.parentDocument !== undefined) {
        params.set("parentDocument", options.parentDocument === null ? "null" : options.parentDocument);
      }
      if (options?.publicSorted !== undefined) {
        params.set("publicSorted", String(options.publicSorted));
      }
      const query = params.toString();
      return `/api/documents/sidebar${query ? `?${query}` : ""}`;
    },
    TRASH: (userId?: string | null) =>
      `/api/documents/trash${userId ? `?userId=${encodeURIComponent(userId)}` : ""}`,
    SEARCH: (userId?: string | null) =>
      `/api/documents/search${userId ? `?userId=${encodeURIComponent(userId)}` : ""}`,
    LIMITS: (userId?: string | null) =>
      `/api/documents/limits${userId ? `?userId=${encodeURIComponent(userId)}` : ""}`,
    STATS: (userId?: string | null) =>
      `/api/documents/stats${userId ? `?userId=${encodeURIComponent(userId)}` : ""}`,
    ARCHIVE_SETTINGS: (userId?: string | null) =>
      `/api/documents/archive-settings${userId ? `?userId=${encodeURIComponent(userId)}` : ""}`,
    BY_ID: (
      id: string,
      options?: { userId?: string; alwaysView?: boolean }
    ) => {
      const params = new URLSearchParams();
      if (options?.userId) params.set("userId", options.userId);
      if (options?.alwaysView) params.set("alwaysView", "true");
      const query = params.toString();
      return `/api/documents/${id}${query ? `?${query}` : ""}`;
    },
    BY_SHORT_ID: (shortId: string) => `/api/documents/short/${shortId}`,
    LOGS: (id: string, orgId?: string, fallbackPremiumLevel?: number) => {
      const params = new URLSearchParams();
      if (orgId) params.set("orgId", orgId);
      if (fallbackPremiumLevel !== undefined) {
        params.set("fallbackPremiumLevel", String(fallbackPremiumLevel));
      }
      const query = params.toString();
      return `/api/documents/${id}/logs${query ? `?${query}` : ""}`;
    },
  },
  AUDIT_LOGS: {
    GET: (options?: { orgId?: string; fallbackPremiumLevel?: number }) => {
      const params = new URLSearchParams();
      if (options?.orgId) params.set("orgId", options.orgId);
      if (options?.fallbackPremiumLevel !== undefined) {
        params.set("fallbackPremiumLevel", String(options.fallbackPremiumLevel));
      }
      const query = params.toString();
      return `/api/audit-logs${query ? `?${query}` : ""}`;
    },
    EXPORT: (orgId: string, fallbackPremiumLevel?: number) => {
      const params = new URLSearchParams({ orgId });
      if (fallbackPremiumLevel !== undefined) {
        params.set("fallbackPremiumLevel", String(fallbackPremiumLevel));
      }
      return `/api/audit-logs/export?${params.toString()}`;
    },
  },
  BACKEND: {
    FILES: {
      UPLOAD: "files/upload",
      BY_USER: (userid: string) => `files/user/${userid}`,
      DELETE: "files/delete",
    },
    USERS: {
      ADD: (_id: string) => `users/add/${_id}`,
      BY_USERNAME: (username: string) => `users/by_username/${username}`,
      BY_ID: (_id: string) => `users/by_id/${_id}`,
      UPDATE: (_id: string) => `users/update/${_id}`,
      MODERATOR: (_id: string) => `users/${_id}/moderator`,
    },
    ORGS: {
      ADD: (_id: string) => `orgs/add/${_id}`,
      BY_USERNAME: (username: string) => `orgs/by_username/${username}`,
      BY_ID: (_id: string) => `orgs/by_id/${_id}`,
      UPDATE: (_id: string) => `orgs/update/${_id}`,
    },
    ADMIN: {
      USERS: {
        PREMIUM: (_id: string) => `admin/users/${_id}/premium`,
        MODERATOR: (_id: string) => `admin/users/${_id}/moderator`,
        BADGE: (_id: string) => `admin/users/${_id}/badge`,
        VERIFIED_ORGS: (_id: string) => `admin/users/${_id}/verified_orgs`,
      },
      ORGS: {
        PREMIUM: (_id: string) => `admin/orgs/${_id}/premium`,
        BADGE: (_id: string) => `admin/orgs/${_id}/badge`,
      },
    },
  },
} as const;
