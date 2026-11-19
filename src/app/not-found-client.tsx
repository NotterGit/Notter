"use client"

import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { images } from "@/config/routing/image.route"
import { pages } from "@/config/routing/pages.route"

export default function NotFoundClient() {
  const router = useRouter()

  return (
    <div className="page-glow flex min-h-dvh items-center justify-center px-5 py-12">
      <div className="flex w-full max-w-xl flex-col items-center gap-6 md:flex-row md:gap-8">
        <div className="flex-shrink-0">
          <Image
            src={images.ILLUSTRATIONS.ERROR}
            width={140}
            height={200}
            alt=""
            className="h-auto w-28 object-contain md:w-36"
          />
        </div>

        <div className="flex-1 text-center md:text-left">
          <p className="mb-1 text-sm font-medium tabular-nums text-muted-foreground">404</p>
          <h1 className="text-balance text-2xl font-semibold md:text-3xl">Страница не найдена</h1>

          <div className="mt-5 flex flex-wrap justify-center gap-2 md:justify-start">
            <Button asChild>
              <Link href={pages.ROOT}>На главную</Link>
            </Button>

            <Button variant="ghost" onClick={() => router.back()}>
              Назад
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
