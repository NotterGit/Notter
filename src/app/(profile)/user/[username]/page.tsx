import { redirect } from "next/navigation";

import { pages } from "@/config/routing/pages.route";
import type { UsernameProps } from "@/config/types/profile.types";

export default async function LegacyUserProfilePage({ params }: UsernameProps) {
  const { username } = await params;

  redirect(pages.PROFILE(false, username));
}
