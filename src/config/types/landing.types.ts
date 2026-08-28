import type { LucideIcon } from "lucide-react"

export type NavbarProps = {
  logo?: boolean
}

export interface CardProps {
  name: string
  description: string
  img?: any
  icon?: LucideIcon
  title?: string
}

export interface PremiumCardProps {
  title: string;
  price: number;
  className?: string;
  icon?: string;
  features: string[];
  btn?: boolean;
  isPopular?: boolean;
}