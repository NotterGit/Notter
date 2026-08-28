"use client"

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { links } from "@/config/routing/links.route";
import { pages } from "@/config/routing/pages.route";
import { images } from "@/config/routing/image.route";
import { VersionBadge } from "@/components/version-badge";
import { BETA_HOSTS } from "@/config/const/app.const";

export function Footer(){
    const currentYear = new Date().getFullYear()
    const [isBeta, setIsBeta] = useState(false)

    useEffect(() => {
        setIsBeta(
            BETA_HOSTS.includes(window.location.hostname) ||
            BETA_HOSTS.includes(window.location.host)
        )
    }, [])

    const darkLogoSrc = isBeta ? images.LOGOS.BETA : images.LOGOS.DARK;

    return (
        <footer className="dark:bg-zinc-950 rounded-lg m-4">
            <div className="w-full max-w-screen-xl mx-auto p-4 md:py-8 ">
                <div className="sm:flex sm:items-center sm:justify-between">
                    <Link href={pages.ROOT} className="flex items-center mb-4 sm:mb-0 space-x-3 rtl:space-x-reverse">
                        <Image src={darkLogoSrc} height="50" width={isBeta ? 140 : 180} alt="Notter Logo"/>
                    </Link>
                    <ul className="flex flex-wrap items-center mb-6 text-sm font-medium sm:mb-0 text-primary/50">
                        <li>
                            <Link href={links.FEEDBACK} target="_blank" className="me-4 md:me-6 hover:text-primary transition-colors duration-200">Feedback</Link>
                        </li>
                        <li>
                            <Link href={links.QUAL_ID} target="_blank" className="me-4 md:me-6 hover:text-primary transition-colors duration-200">Qual ID</Link>
                        </li>
                        <li>
                            <Link href={links.TELEGRAM} target="_blank" className="me-4 md:me-6 hover:text-primary transition-colors duration-200">Telegram</Link>
                        </li>
                    </ul>
                </div>
                <hr className="my-6 border-gray-300 dark:border-gray-200 sm:mx-auto lg:my-8" />
                <span className="block text-sm text-primary/50 sm:text-center">
                    © 2024-{currentYear} <Link href={links.QUALSU} className="hover:text-primary transition-colors duration-200">Qualsu</Link>
                    {isBeta && (
                        <>
                            {" • "}
                            <VersionBadge className="inline-flex items-center select-none" />
                        </>
                    )}
                </span>
            </div>
        </footer>
    )
}
