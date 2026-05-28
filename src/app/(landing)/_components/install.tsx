"use client";

import React, { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import { InstallModal } from "@/components/modal/install-modal";
import type {
  BeforeInstallPromptEvent,
  NavigatorWithStandalone,
  NavigatorWithUserAgentData,
} from "@/config/types/components.types";

const PHONE_USER_AGENT_REGEXP =
  /Android.+Mobile|iPhone|iPod|Windows Phone|IEMobile|Opera Mini|BlackBerry|BB10/i;

const isIosStandalone = () =>
  Boolean((navigator as NavigatorWithStandalone).standalone);

const isPhoneDevice = () => {
  if (typeof window === "undefined") return false;

  const userAgentData = (navigator as NavigatorWithUserAgentData).userAgentData;

  if (typeof userAgentData?.mobile === "boolean") {
    return userAgentData.mobile;
  }

  return PHONE_USER_AGENT_REGEXP.test(navigator.userAgent);
};

const InstallPWA = () => {
  const [promptInstall, setPromptInstall] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => null);
    }

    const standaloneQuery = window.matchMedia("(display-mode: standalone)");
    const updateInstalledState = () => {
      setIsInstalled(standaloneQuery.matches || isIosStandalone());
    };

    const beforeInstallPromptHandler = (event: Event) => {
      event.preventDefault();
      setPromptInstall(event as BeforeInstallPromptEvent);
    };

    const appInstalledHandler = () => {
      setPromptInstall(null);
      setIsModalOpen(false);
      setIsInstalled(true);
      toast.success("Notter установлен");
    };

    updateInstalledState();
    window.addEventListener("beforeinstallprompt", beforeInstallPromptHandler);
    window.addEventListener("appinstalled", appInstalledHandler);
    standaloneQuery.addEventListener("change", updateInstalledState);

    return () => {
      window.removeEventListener("beforeinstallprompt", beforeInstallPromptHandler);
      window.removeEventListener("appinstalled", appInstalledHandler);
      standaloneQuery.removeEventListener("change", updateInstalledState);
    };
  }, []);

  const installPwa = async () => {
    if (!promptInstall) {
      toast(
        "Если окно установки не появилось, откройте сайт в Chrome или Edge через HTTPS/localhost и нажмите значок установки в адресной строке."
      );
      return;
    }

    try {
      await promptInstall.prompt();
      const choice = await promptInstall.userChoice?.catch(() => null);

      if (choice?.outcome === "accepted") {
        toast.success("Установка запущена");
        setIsModalOpen(false);
      }
    } finally {
      setPromptInstall(null);
    }
  };

  const onClick = async (event: React.MouseEvent) => {
    event.preventDefault();

    if (isPhoneDevice()) {
      await installPwa();
      return;
    }

    setIsModalOpen(true);
  };

  if (isInstalled) return null;

  return (
    <>
      <Button
        className="link-button mt-2 md:mt-0"
        id="setup_button"
        aria-label="Установить приложение"
        title="Установить приложение"
        onClick={onClick}
        variant="outline"
      >
        Установить <Download className="ml-2 h-4 w-4" />
      </Button>
      <InstallModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onInstallPwa={installPwa}
        canInstallPwa={Boolean(promptInstall)}
      />
    </>
  );
};

export default InstallPWA;
