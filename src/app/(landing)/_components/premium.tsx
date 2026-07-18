"use client"

import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Check, X } from "lucide-react";
import PremiumCard from "./premium-card";
import { images } from "@/config/routing/image.route";
import { getPlanLimitsByTier } from "@/lib/plan-limits";

export function Premium() {
  const [isTeam, setIsTeam] = useState(false);

  const toggleAccountType = (type: "personal" | "team") => {
    setIsTeam(type === "team");
  };

  const amberPrice = isTeam ? 149 : 29;
  const diamondPrice = isTeam ? 299 : 99;
  const freePrice = 0;

  const limits = getPlanLimitsByTier(isTeam);

  return (
    <div className="p-6">
      <h1 className="text-5xl font-bold drop-shadow-sm">
        <span className="bg-gradient-to-r from-logo-yellow to-logo-light-yellow bg-clip-text text-transparent">Notter </span>
        <span className="text-logo-cyan">Gem</span>
      </h1>

      <p className="m-4">Подписка, улучшающая и делающая работу еще приятнее</p>

      <div className="flex justify-center items-center mb-6 space-x-6">
        <Button onClick={() => toggleAccountType("personal")} className={`text-lg ${!isTeam ? "underline" : ""}`} variant={"ghost"}>
          Личная
        </Button>
        <span>|</span>
        <Button onClick={() => toggleAccountType("team")} className={`text-lg ${isTeam ? "underline" : ""}`} variant={"ghost"}>
          Командная
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
        <PremiumCard
          title="Free"
          price={freePrice}
          className="border-gray-300"
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
          className="border-yellow-300"
          icon={images.BADGE.AMBER}
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
          className="border-cyan-300"
          icon={images.BADGE.DIAMOND}
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

      <Table className="mt-6">
        <TableCaption>Сравнение лимитов тарифов</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Характеристика</TableHead>
            <TableHead>Free</TableHead>
            <TableHead className="text-yellow-500">Amber</TableHead>
            <TableHead className="text-cyan-500">Diamond</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="text-left">
          <TableRow>
            <TableCell>Заметки</TableCell>
            <TableCell>{limits.free.documents}</TableCell>
            <TableCell>{limits.amber.documents}</TableCell>
            <TableCell>{limits.diamond.documents}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Публичные заметки</TableCell>
            <TableCell>{limits.free.publicDocuments}</TableCell>
            <TableCell>{limits.amber.publicDocuments}</TableCell>
            <TableCell>{limits.diamond.publicDocuments}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Максимальный размер загружаемых изображений</TableCell>
            <TableCell>{limits.free.uploadMb} МБ</TableCell>
            <TableCell>{limits.amber.uploadMb} МБ</TableCell>
            <TableCell>{limits.diamond.uploadMb} МБ</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Значок в профиле</TableCell>
            <TableCell><X size={16} /></TableCell>
            <TableCell><Check size={16} /></TableCell>
            <TableCell><Check size={16} /></TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Сокращенные ссылки</TableCell>
            <TableCell><X size={16} /></TableCell>
            <TableCell><Check size={16} /></TableCell>
            <TableCell><Check size={16} /></TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Кастомные ссылки</TableCell>
            <TableCell><X size={16} /></TableCell>
            <TableCell><X size={16} /></TableCell>
            <TableCell><Check size={16} /></TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Отключение упоминаний</TableCell>
            <TableCell><X size={16} /></TableCell>
            <TableCell><X size={16} /></TableCell>
            <TableCell><Check size={16} /></TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Скачивание/загрузка в JSON</TableCell>
            <TableCell><X size={16} /></TableCell>
            <TableCell><X size={16} /></TableCell>
            <TableCell><Check size={16} /></TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}
