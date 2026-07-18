import type { Metadata } from "next"

import { MainLayoutClient } from "@/components/layouts/main-layout-client"

export const metadata: Metadata = {
  title: "Dashboard",
}

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <MainLayoutClient>{children}</MainLayoutClient>
}
