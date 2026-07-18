"use client"

import Image from "next/image";
import Link from "next/link";
import { links } from "@/config/routing/links.route";
import { pages } from "@/config/routing/pages.route";
import { images } from "@/config/routing/image.route";

export function Footer(){
    const currentYear = new Date().getFullYear()

    return (
        <footer className="dark:bg-zinc-950 rounded-lg m-4">
            <div className="w-full max-w-screen-xl mx-auto p-4 md:py-8 ">
                <div className="sm:flex sm:items-center sm:justify-between">
                    <Link href={pages.ROOT} className="flex items-center mb-4 sm:mb-0 space-x-3 rtl:space-x-reverse">
                        <Image src={images.IMAGE.LIGHT_LOGO} height="50" width="180" alt="Notter Logo" className="block dark:hidden"/>
                        <Image src={images.IMAGE.DARK_LOGO} height="50" width="180" alt="Notter Logo" className="hidden dark:block"/>
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
                <span className="block text-sm text-primary/50 sm:text-center">© 2024-{currentYear} <Link href={links.QUALSU} className="hover:text-primary transition-colors duration-200">Qualsu</Link></span>
            </div>
        </footer>
    )
}
