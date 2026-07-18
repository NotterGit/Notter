"use client";

import Image from "next/image";
import { Download, Globe, Laptop, MonitorDown } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { images } from "@/config/routing/image.route";
import { links } from "@/config/routing/links.route";
import Link from "next/link";

type InstallModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInstallPwa: () => void | Promise<void>;
  canInstallPwa: boolean;
};

export const InstallModal = ({
  open,
  onOpenChange,
  onInstallPwa,
  canInstallPwa,
}: InstallModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl gap-6 overflow-hidden p-0">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle>Установить Notter</DialogTitle>
          <DialogDescription>
            Выберите удобный способ установки приложения на компьютер.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 px-6 pb-6 md:grid-cols-[1.05fr_0.95fr]">
          <section className="flex min-h-[320px] flex-col overflow-hidden rounded-lg border bg-muted/30">
            <div className="relative flex min-h-44 w-full items-center justify-center overflow-hidden border-b bg-background p-2">
              <Image
                src={images.IMAGE.INSTALL_PWA}
                alt="Установка Notter как PWA в браузере"
                width={354}
                height={156}
                className="h-auto max-h-full w-full object-contain"
                sizes="(min-width: 768px) 380px, 100vw"
                quality={100}
                unoptimized
              />
            </div>

            <div className="flex flex-1 flex-col gap-4 p-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Globe className="h-4 w-4" />
                  PWA в браузере
                </div>
                <p className="text-sm text-muted-foreground">
                  Установите Notter через Chrome или Edge. Приложение откроется
                  в отдельном окне и будет доступно рядом с обычными программами
                </p>
              </div>

              <Button
                className="mt-auto w-full"
                onClick={onInstallPwa}
                disabled={!canInstallPwa}
              >
                Установить через браузер
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </section>

          <section className="flex min-h-[320px] flex-col gap-3 rounded-lg border bg-background p-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <MonitorDown className="h-4 w-4" />
              Десктопная версия
            </div>

            <p className="text-sm text-muted-foreground">
              Отдельные сборки для Windows и Linux
            </p>

            <div className="mt-2 grid gap-3">
              <Button
                asChild
                variant="outline"
                className="h-auto justify-start gap-3 p-4"
              >
                <Link href={links.DOWNLOAD.WINDOWS} download="Notter.msi">
                  <Laptop className="h-5 w-5" />
                  <span className="flex flex-col items-start text-left">
                    <span>Скачать для Windows</span>
                    <span className="text-xs font-normal text-muted-foreground">
                      Windows Installer (.msi)
                    </span>
                  </span>
                </Link>
              </Button>
              
              <Button
                asChild
                variant="outline"
                className="h-auto justify-start gap-3 p-4"
              >
                <Link href={links.DOWNLOAD.LINUX.DEB} download="Notter.deb">
                  <Laptop className="h-5 w-5" />
                  <span className="flex flex-col items-start text-left">
                    <span>Скачать для Linux</span>
                    <span className="text-xs font-normal text-muted-foreground">
                      dpkg (.deb)
                    </span>
                  </span>
                </Link>
              </Button>

              <Button
                asChild
                variant="outline"
                className="h-auto justify-start gap-3 p-4"
              >
                <Link href={links.DOWNLOAD.LINUX.APPIMAGE} download="Notter.deb">
                  <Laptop className="h-5 w-5" />
                  <span className="flex flex-col items-start text-left">
                    <span>Скачать для Linux</span>
                    <span className="text-xs font-normal text-muted-foreground">
                      AppImage
                    </span>
                  </span>
                </Link>
              </Button>
            </div>

            <p className="text-sm text-primary/50">
              Или напрямую с{" "}
              <Link
                href={links.DOWNLOAD.GITHUB}
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors duration-200 hover:text-primary/75"
              >
                GitHub
              </Link>
            </p>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
};
