import type { ReactNode } from "react"

import { PublicLayout } from "./_components/public-layout"

export default function Layout({
  children,
}: {
  children: ReactNode
}) {
  return <PublicLayout>{children}</PublicLayout>
}
