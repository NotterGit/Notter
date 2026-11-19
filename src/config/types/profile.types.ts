import type * as React from "react"
import type { Org, User } from "./api.types"

export type VerifedBadgeProps = {
  text: string;
  size: number;
  clicked?: boolean;
  down?: boolean;
}

export type BadgesProps = {
  profile: User | Org
}

export interface UserProps {
  user: User | Org | null;
}

export interface DocumentListProps {
  user: User | Org;
  setProfile: React.Dispatch<React.SetStateAction<User | Org | null>>;
}

export interface ProfileImageProps {
  url?: string | null;
  fallback?: string;
  className: string;
  sizes: string;
}

export interface OrgProps {
  params: Promise<{
    orgname: string;
  }>;
}

export interface UsernameProps {
  params: Promise<{
    username: string;
  }>;
}

export interface ProfilePageComponentProps {
  kind: "user" | "org";
  slug: string;
}
