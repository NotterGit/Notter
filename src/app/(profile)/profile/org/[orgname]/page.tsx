import type { Metadata } from "next"

import { getOrgByUsername } from "@/api/org"
import type { OrgProps } from "@/config/types/profile.types"

import ProfilePage from "../../../_components/profile-page"

export async function generateMetadata({ params }: OrgProps): Promise<Metadata> {
  const { orgname } = await params
  const profile = await getOrgByUsername(orgname)

  if (!profile) {
    return { title: "Page not found" }
  }

  return {
    title: profile.name || profile.username || "Profile",
  }
}

export default async function OrganizationProfilePage({ params }: OrgProps) {
  const { orgname } = await params

  return <ProfilePage kind="org" slug={orgname} />
}
