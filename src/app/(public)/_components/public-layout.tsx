"use client"

import { createContext, useContext, useState } from "react"
import type { ReactNode } from "react"
import { usePathname } from "next/navigation"

import { Navbar } from "../../(landing)/_components/navbar"

const PublicNavbarContext = createContext<(logo: boolean) => void>(() => {})

export function usePublicNavbar() {
  return useContext(PublicNavbarContext)
}

export function PublicLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const [logo, setLogo] = useState(true)
  const isIframe = pathname.endsWith("/iframe")

  if (isIframe) {
    return <>{children}</>
  }

  return (
    <PublicNavbarContext.Provider value={setLogo}>
      <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-background via-background to-logo-yellow/10 text-foreground dark:to-logo-cyan/10">
        <div className="pointer-events-none absolute left-0 top-24 h-72 w-72 rounded-full bg-logo-light-yellow/20 blur-3xl" />
        <div className="pointer-events-none absolute right-0 top-64 h-72 w-72 rounded-full bg-logo-cyan/15 blur-3xl" />
        <Navbar logo={logo} />
        {children}
      </div>
    </PublicNavbarContext.Provider>
  )
}
