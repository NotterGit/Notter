"use client"

import Image from "next/image"
import Link from "next/link"
import { SignedOut, SignInButton, UserButton } from "@clerk/clerk-react"
import { SignedIn, useAuth } from "@clerk/nextjs"
import { useConvexAuth } from "convex/react"

import { ModeToggle } from "@/components/mode-toggle"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { images } from "@/config/routing/image.route"
import { pages } from "@/config/routing/pages.route"
import type { NavbarProps } from "@/config/types/landing.types"
import { cn } from "@/lib/utils"

import { useScrollTop } from "../../../components/hooks/use-scroll-top"

export function Navbar({ logo = true }: NavbarProps) {
  const scrolled = useScrollTop()
  const { isLoaded } = useAuth()
  const { isLoading } = useConvexAuth()
  const authLoading = !isLoaded || isLoading

  return (
    <div
      className={cn(
        "fixed top-0 z-50 flex h-14 w-full items-center justify-between bg-background p-6 dark:bg-zinc-950",
        scrolled && "border-b shadow-sm"
      )}
    >
      <div className="container mx-3 flex items-center justify-between md:mx-auto">
        <Link href={pages.ROOT}>
          <Image
            src={images.IMAGE.LIGHT_ICON}
            height={35}
            width={35}
            alt="Notter"
            className={`${!logo ? "hidden" : ""} block dark:hidden`}
          />
          <Image
            src={images.IMAGE.DARK_ICON}
            height={35}
            width={35}
            alt="Notter"
            className={`${!logo ? "hidden" : ""} hidden dark:block`}
          />
        </Link>

        <div className="flex items-center gap-2">
          {authLoading ? (
            <div className={`${!logo ? "hidden" : ""} mr-3 flex items-center gap-2`}>
              <Skeleton className="mr-1 h-8 w-20 rounded-md" />
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
          ) : (
            <>
              <SignedIn>
                <Link href={pages.DASHBOARD()} className={!logo ? "hidden" : undefined}>
                  <Button variant="ghost">Перейти</Button>
                </Link>
                <div className={`${!logo ? "hidden" : ""} mr-4 mt-1 items-center`}>
                  <UserButton />
                </div>
              </SignedIn>

              <SignedOut>
                <SignInButton>
                  <Link href={pages.AUTH} className={!logo ? "hidden" : undefined}>
                    <Button variant="ghost">Войти</Button>
                  </Link>
                </SignInButton>
              </SignedOut>
            </>
          )}

          <ModeToggle />
        </div>
      </div>
    </div>
  )
}
