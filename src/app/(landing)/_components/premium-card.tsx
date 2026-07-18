import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { pages } from "@/config/routing/pages.route";
import type { PremiumCardProps } from "@/config/types/landing.types";

export default function PremiumCard({ title, price, className, icon, features, btn = true }: PremiumCardProps) {
  return (
    <div className={`rounded-2xl p-6 shadow-lg transition-transform hover:scale-[1.02] flex flex-col bg-card/70 dark:bg-zinc-900/60 ${className}`}>
      <div className="flex items-center gap-3">
        {icon && (
          <Image src={icon} alt={title} width={36} height={36} className="object-contain" />
        )}
        <div>
          <h3 className="text-2xl font-semibold">{title}</h3>
          <div className="text-sm text-muted-foreground">{price}₽ / навсегда</div>
        </div>
      </div>

      <ul className="list-disc pl-5 mt-4 space-y-2 flex-grow">
        {features.map((feature, index) => (
          <li key={index} className="text-sm">{feature}</li>
        ))}
      </ul>

      {btn && (
        <Link href={pages.BUY} className="mt-6">
          <Button variant={"outline"} className="w-full">
            Перейти
          </Button>
        </Link>
      )}
    </div>
  )
}