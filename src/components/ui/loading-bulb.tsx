import Image from "next/image"

import { images } from "@/config/routing/image.route"
import type { LoadingBulbProps } from "@/config/types/components.types"

export function LoadingBulb({ alt, size }: LoadingBulbProps) {
  return (
    <Image
      src={images.LANDING.LAMP}
      alt={alt}
      width={size}
      height={size}
      loading="eager"
      className="shrink-0 object-contain motion-safe:animate-pulse"
    />
  )
}
