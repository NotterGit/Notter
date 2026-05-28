"use client"

import { Navbar } from "@/app/(landing)/_components/navbar"

export function BuyLayoutClient({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-background via-background to-logo-yellow/10 dark:to-logo-cyan/10">
      <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-logo-light-yellow/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 right-10 h-72 w-72 rounded-full bg-logo-cyan/15 blur-3xl" />
      <Navbar />
      {children}
    </div>
  )
}
