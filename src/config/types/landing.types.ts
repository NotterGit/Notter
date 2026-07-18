export type NavbarProps = {
  logo?: boolean
}

export interface CardProps {
  name: string
  description: string
  img: any
}

export interface PremiumCardProps {
  title: string;
  price: number;
  className: string;
  icon?: string;
  features: string[];
  btn?: boolean;
}