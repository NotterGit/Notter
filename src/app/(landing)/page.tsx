import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import { About } from "./_components/about"
import { Footer } from "./_components/footer"
import { GoBackendBanner } from "./_components/go-backend-banner"
import { Heading } from "./_components/heading"
import { LandingRedirect } from "./_components/landing-redirect"
import { Premium } from "./_components/premium"
import { pages } from "@/config/routing/pages.route"

export default async function Landing() {
  const cookieStore = await cookies()
  const redirectEnabled = cookieStore.get("redirect")?.value === "true"

  if (redirectEnabled) {
    redirect(pages.DASHBOARD())
  }

  return (
    <div className="flex min-h-full flex-col">
      <LandingRedirect />
      <div className="m-0 flex flex-1 flex-col items-center justify-center gap-y-8 p-0 px-6 pb-10 text-center md:justify-start">
        <GoBackendBanner />

        <div className="relative mx-auto w-full max-w-6xl">
          <div className="absolute -right-20 -top-20 -z-10 h-72 w-72 rounded-full bg-logo-yellow opacity-30 blur-3xl dark:bg-logo-light-yellow" />
          <div className="absolute -bottom-36 -left-24 -z-10 h-96 w-96 rounded-full bg-logo-cyan opacity-20 blur-3xl" />
          <Heading />
        </div>

        <div className="mx-auto w-full max-w-6xl">
          <About />
        </div>

        <div className="mx-auto w-full max-w-6xl">
          <Premium />
        </div>
      </div>
      <Footer />
    </div>
  )
}
