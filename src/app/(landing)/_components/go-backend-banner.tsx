"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { ExternalLink, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { links } from "@/config/routing/links.route"
import { images } from "@/config/routing/image.route"

const STORAGE_KEY = "notter-cpp-backend-banner-hidden"

export function GoBackendBanner() {
  const [shouldRender, setShouldRender] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY) === "true") {
      return
    }

    setShouldRender(true)
    const frame = requestAnimationFrame(() => setIsVisible(true))

    return () => cancelAnimationFrame(frame)
  }, [])

  const hideBanner = () => {
    localStorage.setItem(STORAGE_KEY, "true")
    setIsVisible(false)
    setIsModalOpen(false)

    window.setTimeout(() => {
      setShouldRender(false)
    }, 200)
  }

  if (!shouldRender) {
    return null
  }

  return (
    <>
      <div className="pointer-events-none fixed left-0 right-0 top-16 z-[60] px-4">
        <div
          className={`pointer-events-auto relative mx-auto flex w-full max-w-6xl flex-col gap-3 rounded-lg border bg-background/95 px-4 py-3 text-left shadow-lg backdrop-blur transition-all duration-200 ease-out sm:flex-row sm:items-center sm:justify-between ${
            isVisible ? "translate-y-0 opacity-100" : "-translate-y-3 opacity-0"
          }`}
        >
          <div className="flex min-w-0 items-center gap-3 pr-10 sm:pr-0">
            <div className="mt-0.5">
              <Image
                src={images.LANDING.INAPI_LOGO}
                alt="InAPI"
                width={50}
                height={50}
                className="h-auto w-6.5"
                unoptimized
              />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-foreground">
                Не Go, так C++
              </h2>
              <p className="text-sm text-muted-foreground">
                Второй экспереиментальный Бекенд
              </p>
            </div>
          </div>

          <div className="flex w-full shrink-0 items-center gap-2 sm:w-auto">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setIsModalOpen(true)}
              className="w-full"
            >
              Подробнее
            </Button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="absolute right-3 top-3 h-8 w-8 sm:static"
              onClick={hideBanner}
              aria-label="Скрыть плашку"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="overflow-hidden p-0 sm:max-w-md">
          <div className="relative flex h-64 items-center justify-center overflow-hidden border-b px-6">
            <Image
              src={images.LANDING.INAPI}
              alt="InAPI"
              width={480}
              height={360}
              className="h-full w-auto object-contain"
              sizes="(min-width: 640px) 432px, 100vw"
              unoptimized
            />
          </div>

          <div className="space-y-5 p-6 pt-5">
            <DialogHeader>
              <DialogTitle className="text-left">Может на плюсах?</DialogTitle>
              <DialogDescription className="text-sm leading-6 text-foreground/80 text-left">
                Бекенд на Go не показал себя с лучшей стороны, поэтому мы решили попробовать другой язык. Сейчас тестируем второй экспериментальный Бекенд на C++ на нашей собственной библиотеке InAPI. Если хотите помочь нам в тестировании, пожалуйста, оставьте отзыв заполнив форму
              </DialogDescription>
            </DialogHeader>

            <Button asChild className="w-full sm:w-fit">
              <Link href={links.FEEDBACK} target="_blank" rel="noreferrer">
                Открыть форму
                <ExternalLink className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
