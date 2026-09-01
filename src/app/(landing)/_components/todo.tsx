import Image from "next/image"
import Link from "next/link"
import { ChevronRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { images } from "@/config/routing/image.route"
import { links } from "@/config/routing/links.route"

export function Todo() {
  return (
    <section className="grid items-center px-4 py-8 md:grid-cols-2">
      <div className="mt-6 flex justify-center md:mt-0 drop-shadow-xl drop-shadow-white/15">
        <Image
          src={images.ILLUSTRATIONS.TODO}
          alt="Notter ToDo"
          width={500}
          height={500}
          className="rounded-2xl object-contain"
        />
      </div>
      <div className="space-y-4 text-left">
        <h2 className="text-4xl font-extrabold leading-tight sm:text-5xl md:text-6xl">
          Управляйте задачами вместе с{" "}
          <span className="bg-gradient-to-r from-logo-yellow to-logo-light-yellow bg-clip-text text-transparent">
            Notter ToDo
          </span>
        </h2>
        <p className="max-w-xl text-lg text-muted-foreground">
          Быстрый и удобный сервис для создания списков дел и управления задачами. Организуйте свои планы
        </p>

        <span>
          <Link href={links.TODO} target="_blank" rel="noreferrer">
            <Button className="mt-2">
              Перейти в ToDo <ChevronRight />
            </Button>
          </Link>
        </span>
      </div>
    </section>
  )
}
