import Image from "next/image";
import { useState } from "react";
import type { ProfileImageProps } from "@/config/types/profile.types";
import { normalizeImageUrl } from "@/lib/image-url";

export function ProfileImage({ url, fallback, className, sizes }: ProfileImageProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const src = normalizeImageUrl(url);
  const displaySrc = src && src !== failedSrc ? src : fallback;

  if (!displaySrc) return null;

  return (
    <div className={className}>
      <Image
        src={displaySrc}
        alt=""
        fill
        sizes={sizes}
        unoptimized={displaySrc.startsWith("/api/image?")}
        className="object-cover"
        onError={() => {
          if (displaySrc === src) setFailedSrc(src);
        }}
      />
    </div>
  );
}
