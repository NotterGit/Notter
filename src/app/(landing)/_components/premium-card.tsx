import Image from "next/image"
import Link from "next/link"
import { Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { pages } from "@/config/routing/pages.route"
import type { PremiumCardProps } from "@/config/types/landing.types"
import { cn } from "@/lib/utils"

export default function PremiumCard({ title, price, className, icon, features, btn = true, isPopular }: PremiumCardProps) {
  return (
    <div
      className={cn(
        "relative flex flex-col rounded-2xl border bg-card/70 dark:bg-zinc-900/60 p-6 backdrop-blur-md transition-all duration-300 hover:scale-[1.02]",
        isPopular && "border-yellow-300/80 dark:border-yellow-300/60",
        className
      )}
    >
      {isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-logo-yellow to-logo-light-yellow px-3 py-0.5 text-xs font-semibold text-zinc-950">
          Популярный выбор
        </div>
      )}

      <div className="flex items-center gap-3">
        {icon && (
          <Image src={icon} alt={title} width={36} height={36} className="object-contain" />
        )}
        <div>
          <h3 className="text-2xl font-bold tracking-tight">{title}</h3>
          <div className="text-sm text-muted-foreground">{price}₽ / навсегда</div>
        </div>
      </div>

      <hr className="my-5 border-border/60" />

      <ul className="space-y-3 text-sm flex-grow">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start gap-2.5">
            <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Check className="h-3 w-3" />
            </div>
            <span className="text-foreground/90">{feature}</span>
          </li>
        ))}
      </ul>

      {btn && (
        <Link href={pages.BUY} className="mt-6 w-full">
          <Button variant="outline" className="w-full">
            Перейти
          </Button>
        </Link>
      )}
    </div>
  )
}
