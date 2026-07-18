import Image from "next/image";
import type { CardProps } from "@/config/types/landing.types";

export function Card({ name, description, img }: CardProps) {
    return (
        <div className="w-full max-w-[1000px] mx-auto bg-white/70 dark:bg-zinc-900/50 backdrop-blur-md rounded-2xl p-6 shadow-md hover:shadow-xl transition">
            <section className="flex items-center md:flex-row flex-col gap-6">
                <div className="flex-shrink-0">
                    <div className="w-24 h-24 rounded-xl bg-white/80 dark:bg-zinc-800/60 flex items-center justify-center shadow-inner">
                        <Image src={img} width={48} height={48} alt="" />
                    </div>
                </div>

                <div className="text-center md:text-left">
                    <h3 className="text-2xl md:text-3xl font-semibold mb-2">{name}</h3>
                    <p className="text-base text-muted-foreground max-w-lg">{description}</p>
                </div>
            </section>
        </div>
    )
}