"use client";

import Image from "next/image";
import { Download, Globe, Laptop, MonitorDown, ChevronDown } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
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
                src={images.ILLUSTRATIONS.INSTALL_PWA}
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

          <section className="flex min-h-[320px] flex-col overflow-hidden rounded-lg border bg-muted/30">
            <div className="relative flex min-h-44 w-full flex-col items-center justify-center overflow-hidden border-b bg-background p-4 text-center">
              <div className="rounded-full bg-primary/10 p-3 text-primary">
                <Laptop className="h-8 w-8" />
              </div>
            </div>

            <div className="flex flex-1 flex-col gap-4 p-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <MonitorDown className="h-4 w-4" />
                  Десктопная версия
                </div>
                <p className="text-xs text-muted-foreground">
                  Скачайте сборку для вашей операционной системы
                </p>
              </div>

              <div className="mt-auto flex flex-col gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="h-auto w-full justify-between gap-2.5 p-2.5 hover:bg-accent/50 transition-all duration-200"
                    >
                      <span className="flex flex-col items-start text-left">
                        <span className="text-xs font-semibold">Скачать для Windows</span>
                      </span>
                      <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-[260px]">
                    <DropdownMenuItem asChild>
                      <Link
                        href={links.DOWNLOAD.WINDOWS}
                        download="Notter.msi"
                        className="flex w-full flex-col items-start gap-0.5 cursor-pointer p-1.5"
                      >
                        <span className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                          Stable
                          <span className="inline-flex items-center rounded bg-green-500/10 px-1 py-0.5 text-[9px] font-medium text-green-500 ring-1 ring-inset ring-green-500/20">
                            Recommend
                          </span>
                        </span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link
                        href={links.DOWNLOAD.WINDOWS_DEV}
                        download="Notter.Dev.msi"
                        className="flex w-full flex-col items-start gap-0.5 cursor-pointer p-1.5"
                      >
                        <span className="font-semibold text-xs text-foreground">
                          Dev
                        </span>
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="h-auto w-full justify-between gap-2.5 p-2.5 hover:bg-accent/50 transition-all duration-200"
                    >
                      <span className="flex flex-col items-start text-left">
                        <span className="text-xs font-semibold">Скачать для Linux</span>
                      </span>
                      <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-[260px]">
                    <DropdownMenuItem asChild>
                      <Link
                        href={links.DOWNLOAD.LINUX.APPIMAGE}
                        download="Notter.AppImage"
                        className="flex w-full flex-col items-start gap-0.5 cursor-pointer p-1.5"
                      >
                        <span className="font-semibold text-xs text-foreground">AppImage</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link
                        href={links.DOWNLOAD.LINUX.DEB}
                        download="Notter.deb"
                        className="flex w-full flex-col items-start gap-0.5 cursor-pointer p-1.5"
                      >
                        <span className="font-semibold text-xs text-foreground">Debian/Ubuntu (.deb)</span>
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <p className="text-[11px] text-muted-foreground text-center mt-1">
                Или напрямую с{" "}
                <Link
                  href={links.DOWNLOAD.GITHUB}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-colors duration-200 hover:text-primary underline underline-offset-2"
                >
                  GitHub
                </Link>
              </p>
            </div>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
};
