"use client"

import Image from "next/image"
import Link from "next/link"
import { useConvexAuth } from "convex/react"

import { Button } from "@/components/ui/button"
import { images } from "@/config/routing/image.route"
import { pages } from "@/config/routing/pages.route"

import InstallPWA from "./install"
import { ChevronRight } from "lucide-react"

export function Heading() {
  const { isAuthenticated } = useConvexAuth()

  return (
    <section className="grid items-center px-4 py-1 md:grid-cols-2">
      <div className="space-y-6 text-left">
        <h1 className="text-4xl font-extrabold leading-tight sm:text-5xl md:text-6xl">
          Думайте, пишите, создавайте. Все это <span className="bg-gradient-to-r from-logo-yellow to-logo-light-yellow bg-clip-text text-transparent">Notter</span>
        </h1>
        <p className="max-w-xl text-lg text-muted-foreground">
          Планируйте, синхронизируйте и работайте в команде в комфортной среде
        </p>

        <span className="space-x-2">
          <Link href={isAuthenticated ? pages.DASHBOARD() : pages.AUTH}>
            <Button className="mt-2">Перейти в Notter <ChevronRight/> </Button>
          </Link>
          <InstallPWA />
        </span>
      </div>

      <div className="mt-6 flex justify-center md:mt-0 drop-shadow-xl drop-shadow-white/15">
        <Image
          src={images.LANDING.HERO}
          alt="Notter"
          width={500}
          height={500}
          priority
        />
      </div>
    </section>
  )
}
