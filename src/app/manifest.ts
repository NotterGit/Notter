import type { MetadataRoute } from "next"
import { headers } from "next/headers"
import { images } from "@/config/routing/image.route"

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const headersList = await headers()
  const host = headersList.get("host") || ""

  const isBeta = host.includes("dev.notter.su") || host.includes("localhost:3001")
  const iconSrc = isBeta ? images.IMAGE.BETA_ICON_192 : "/image/pwa-192.png"
  const icon512Src = isBeta ? images.IMAGE.BETA_ICON_512 : "/image/pwa-512.png"


  return {
    name: "Notter",
    short_name: "Notter",
    description: "Новый уровень построения задач. Встречайте Notter",
    start_url: "/?source=pwa",
    scope: "/",
    id: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#000000",
    icons: [
      {
        src: iconSrc,
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: icon512Src,
        sizes: "512x512",
        type: "image/png",
      },
    ],
  }
}
