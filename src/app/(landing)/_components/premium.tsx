"use client"

import { Button } from "@/components/ui/button"
import { useState } from "react"
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Check, X } from "lucide-react"
import PremiumCard from "./premium-card"
import { images } from "@/config/routing/image.route"
import { getPlanLimitsByTier } from "@/lib/plan-limits"

export function Premium() {
  const [isTeam, setIsTeam] = useState(false)

  const toggleAccountType = (type: "personal" | "team") => {
    setIsTeam(type === "team")
  }

  const amberPrice = isTeam ? 149 : 29
  const diamondPrice = isTeam ? 299 : 99
  const freePrice = 0

  const limits = getPlanLimitsByTier(isTeam)

  return (
    <section className="space-y-8 px-4">
      <div className="mx-auto max-w-2xl text-center space-y-3">
        <h2 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
          <span className="bg-gradient-to-r from-logo-yellow to-logo-light-yellow bg-clip-text text-transparent">Notter </span>
          <span className="text-logo-cyan">Gem</span>
        </h2>

        <p className="text-muted-foreground text-sm sm:text-base">Подписка, улучшающая и делающая работу еще приятнее</p>

        <div className="inline-flex items-center justify-center rounded-xl border border-border/60 bg-muted/50 p-1 backdrop-blur-sm">
          <Button
            size="sm"
            onClick={() => toggleAccountType("personal")}
            variant={!isTeam ? "default" : "ghost"}
            className="rounded-lg text-sm transition-all"
          >
            Личная
          </Button>
          <Button
            size="sm"
            onClick={() => toggleAccountType("team")}
            variant={isTeam ? "default" : "ghost"}
            className="rounded-lg text-sm transition-all"
          >
            Командная
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
        <PremiumCard
          title="Free"
          price={freePrice}
          className="border-gray-300 dark:border-zinc-700"
          features={[
            `До ${limits.free.documents} заметок`,
            `До ${limits.free.publicDocuments} публичных заметок`,
            `Загрузка изображений до ${limits.free.uploadMb} МБ`
          ]}
          btn={false}
        />
        <PremiumCard
          title="Amber"
          price={amberPrice}
          isPopular
          className="border-yellow-300 dark:border-yellow-300/40"
          icon={images.BADGES.AMBER}
          features={[
            "Сокращенные ссылки для публичных заметок",
            "Уникальный значок в профиле",
            `До ${limits.amber.documents} заметок`,
            `До ${limits.amber.publicDocuments} публичных заметок`,
            `Загрузка изображений до ${limits.amber.uploadMb} МБ`
          ]}
        />
        <PremiumCard
          title="Diamond"
          price={diamondPrice}
          className="border-cyan-300 dark:border-cyan-300/40"
          icon={images.BADGES.DIAMOND}
          features={[
            "Все преимущества Amber",
            "Кастомные ссылки",
            "Отключение упоминаний Notter",
            "Скачивание/Загрузка заметок в JSON",
            `До ${limits.diamond.documents} заметок`,
            `До ${limits.diamond.publicDocuments} публичных заметок`,
            `Загрузка изображений до ${limits.diamond.uploadMb} МБ`
          ]}
        />
      </div>

      <div className="mt-10 overflow-hidden rounded-2xl border border-border/60 bg-card/60 dark:bg-zinc-900/40 p-4 backdrop-blur-md">
        <Table>
          <TableCaption>Сравнение лимитов тарифов</TableCaption>
          <TableHeader>
            <TableRow className="border-border/60">
              <TableHead className="w-[40%] font-bold text-foreground">Характеристика</TableHead>
              <TableHead className="font-semibold text-foreground">Free</TableHead>
              <TableHead className="font-semibold text-yellow-400">Amber</TableHead>
              <TableHead className="font-semibold text-cyan-500">Diamond</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="text-left">
            <TableRow className="border-border/40">
              <TableCell className="font-medium">Заметки</TableCell>
              <TableCell>{limits.free.documents}</TableCell>
              <TableCell className="font-medium text-yellow-400">{limits.amber.documents}</TableCell>
              <TableCell className="font-medium text-cyan-500">{limits.diamond.documents}</TableCell>
            </TableRow>
            <TableRow className="border-border/40">
              <TableCell className="font-medium">Публичные заметки</TableCell>
              <TableCell>{limits.free.publicDocuments}</TableCell>
              <TableCell className="font-medium text-yellow-400">{limits.amber.publicDocuments}</TableCell>
              <TableCell className="font-medium text-cyan-500">{limits.diamond.publicDocuments}</TableCell>
            </TableRow>
            <TableRow className="border-border/40">
              <TableCell className="font-medium">Максимальный размер загружаемых изображений</TableCell>
              <TableCell>{limits.free.uploadMb} МБ</TableCell>
              <TableCell className="font-medium text-yellow-400">{limits.amber.uploadMb} МБ</TableCell>
              <TableCell className="font-medium text-cyan-500">{limits.diamond.uploadMb} МБ</TableCell>
            </TableRow>
            <TableRow className="border-border/40">
              <TableCell className="font-medium">Значок в профиле</TableCell>
              <TableCell><X className="h-4 w-4 text-muted-foreground" /></TableCell>
              <TableCell><Check className="h-4 w-4 text-yellow-400" /></TableCell>
              <TableCell><Check className="h-4 w-4 text-cyan-500" /></TableCell>
            </TableRow>
            <TableRow className="border-border/40">
              <TableCell className="font-medium">Сокращенные ссылки</TableCell>
              <TableCell><X className="h-4 w-4 text-muted-foreground" /></TableCell>
              <TableCell><Check className="h-4 w-4 text-yellow-400" /></TableCell>
              <TableCell><Check className="h-4 w-4 text-cyan-500" /></TableCell>
            </TableRow>
            <TableRow className="border-border/40">
              <TableCell className="font-medium">Кастомные ссылки</TableCell>
              <TableCell><X className="h-4 w-4 text-muted-foreground" /></TableCell>
              <TableCell><X className="h-4 w-4 text-muted-foreground" /></TableCell>
              <TableCell><Check className="h-4 w-4 text-cyan-500" /></TableCell>
            </TableRow>
            <TableRow className="border-border/40">
              <TableCell className="font-medium">Отключение упоминаний</TableCell>
              <TableCell><X className="h-4 w-4 text-muted-foreground" /></TableCell>
              <TableCell><X className="h-4 w-4 text-muted-foreground" /></TableCell>
              <TableCell><Check className="h-4 w-4 text-cyan-500" /></TableCell>
            </TableRow>
            <TableRow className="border-border/40">
              <TableCell className="font-medium">Скачивание/загрузка в JSON</TableCell>
              <TableCell><X className="h-4 w-4 text-muted-foreground" /></TableCell>
              <TableCell><X className="h-4 w-4 text-muted-foreground" /></TableCell>
              <TableCell><Check className="h-4 w-4 text-cyan-500" /></TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </section>
  )
}
