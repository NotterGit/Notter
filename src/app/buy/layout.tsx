import type { Metadata } from "next"

import { BuyLayoutClient } from "@/components/layouts/buy-layout-client"

export const metadata: Metadata = {
  title: "Notter Gem",
}

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <BuyLayoutClient>{children}</BuyLayoutClient>
}
