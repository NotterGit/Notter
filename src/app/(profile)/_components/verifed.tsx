import { useState } from 'react'
import type { VerifedBadgeProps } from "@/config/types/profile.types";
import Image from 'next/image';
import { images } from "@/config/routing/image.route";

export default function VerifedBadge({ text, size, clicked = false, down = false }: VerifedBadgeProps) {
  const [isClicked, setIsClicked] = useState(false)

  const handleClick = () => {
    if (clicked) {
      setIsClicked(!isClicked)
    }
  }

  const handleMouseLeave = () => {
    if (clicked && isClicked) {
      setIsClicked(false)
    }
  }

  return (
    <span
      className="group relative inline-flex shrink-0 select-none"
      onMouseLeave={handleMouseLeave}
    >
      <Image
        className={clicked ? "cursor-pointer" : undefined}
        onClick={handleClick}
        alt={text}
        width={size * 4}
        height={size * 4}
        src={images.BADGES.VERIFIED}
      />
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute z-20 ${down ? "top-5 ml-8" : "-top-10"} left-1/2 -translate-x-1/2 rounded-lg border border-white/20 bg-zinc-950/95 px-2 py-1 text-center text-xs whitespace-nowrap text-yellow-200 shadow-lg transition-opacity duration-200
          ${clicked ? (isClicked ? 'opacity-100' : 'opacity-0') : 'opacity-0 group-hover:opacity-100'}
        `}
      >
        {text}
      </span>
    </span>
  )
}
