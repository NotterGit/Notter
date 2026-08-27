import { useAuth, useOrganization } from "@clerk/nextjs"

export function useWorkspaceAdmin() {
  const { organization, membership, isLoaded: isOrgLoaded } = useOrganization()
  const { orgId, orgRole, isLoaded: isAuthLoaded } = useAuth()

  const isLoaded = isOrgLoaded && isAuthLoaded
  const isOrg = Boolean(organization?.id || orgId)

  const isRoleAdmin = (role?: string | null) =>
    role === "org:admin" ||
    role === "admin" ||
    (typeof role === "string" && role.includes("admin"))

  // In personal workspace (!isOrg), the user is the owner and has full admin access.
  // In an organization, only users with an admin role have admin access.
  const isAdmin = isLoaded
    ? !isOrg || isRoleAdmin(orgRole) || isRoleAdmin(membership?.role)
    : false

  return {
    isLoaded,
    isOrg,
    isAdmin,
    orgId: (isOrg ? (organization?.id ?? orgId) : undefined) as string | undefined,
    role: orgRole ?? membership?.role,
  }
}
