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
    <div
      className="relative select-none sm:block group"
      onMouseLeave={handleMouseLeave}
    >
      <Image
        className={`w-${size} h-${size} text-yellow-400 transform transition-transform duration-200 hover:scale-110 cursor-pointer`}
        onClick={handleClick}
        alt='verifed badge'
        width={200}
        height={200}
        src={images.BADGE.VERIFIED}
      />
      <span
        className={`absolute ${down ? "top-5 ml-8" : "-top-10"} left-1/2 -translate-x-1/2 rounded-lg border border-white/20 bg-zinc-950/95 px-2 py-1 text-center text-xs whitespace-nowrap text-yellow-200 shadow-lg transition-opacity duration-200
          ${clicked ? (isClicked ? 'opacity-100' : 'opacity-0') : 'opacity-0 group-hover:opacity-100'}
        `}
      >
        {text}
      </span>
    </div>
  )
}
