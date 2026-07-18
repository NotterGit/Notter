import { redirect } from "next/navigation";

import { pages } from "@/config/routing/pages.route";
import type { OrgProps } from "@/config/types/profile.types";

export default async function LegacyOrgProfilePage({ params }: OrgProps) {
  const { orgname } = await params;

  redirect(pages.PROFILE(true, orgname));
}
