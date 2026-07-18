import type { Metadata } from "next"

import { getByUsername } from "@/app/api/orgs/org"
import type { OrgProps } from "@/config/types/profile.types"

import ProfilePage from "../../../_components/profile-page"

export async function generateMetadata({ params }: OrgProps): Promise<Metadata> {
  const { orgname } = await params
  const profile = await getByUsername(orgname)

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
