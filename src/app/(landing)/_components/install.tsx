"use client";

import React, { useEffect, useState } from "react";
import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import { InstallModal } from "@/components/modal/install-modal";
import type {
  BeforeInstallPromptEvent,
  NavigatorWithUserAgentData,
} from "@/config/types/components.types";
import {
  getIsPwaInstalled,
  getPwaPromptInstall,
  installPwaFromBrowser,
  subscribePwaInstalled,
  subscribePwaPromptInstall,
} from "@/lib/pwa-install";

const PHONE_USER_AGENT_REGEXP =
  /Android.+Mobile|iPhone|iPod|Windows Phone|IEMobile|Opera Mini|BlackBerry|BB10/i;

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
    setPromptInstall(getPwaPromptInstall());
    setIsInstalled(getIsPwaInstalled());

    const unsubscribePrompt = subscribePwaPromptInstall(setPromptInstall);
    const unsubscribeInstalled = subscribePwaInstalled((installed) => {
      setIsInstalled(installed);
      if (installed) {
        setIsModalOpen(false);
      }
    });

    return () => {
      unsubscribePrompt();
      unsubscribeInstalled();
    };
  }, []);

  const installPwa = async () => {
    const accepted = await installPwaFromBrowser();

    if (accepted) {
      setIsModalOpen(false);
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
