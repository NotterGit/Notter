import type { Metadata } from "next"

import { getUserByUsername } from "@/api/user"
import type { UsernameProps } from "@/config/types/profile.types"

import ProfilePage from "../../_components/profile-page"

export async function generateMetadata({ params }: UsernameProps): Promise<Metadata> {
  const { username } = await params
  const profile = await getUserByUsername(username)

  if (!profile) {
    return { title: "Page not found" }
  }

  const fullName = `${profile.firstname ?? ""} ${profile.lastname ?? ""}`.trim()
  const profileName = fullName || profile.username

  return {
    title: `${profileName} - profile | Notter`,
  }
}

export default async function UserProfilePage({ params }: UsernameProps) {
  const { username } = await params

  return <ProfilePage kind="user" slug={username} />
}
