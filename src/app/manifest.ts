import type { MetadataRoute } from "next"
import { headers } from "next/headers"
import { images } from "@/config/routing/image.route"

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const headersList = await headers()
  const host = headersList.get("host") || ""

  const isBeta = host.includes("dev.notter.su") || host.includes("localhost:3001")
  const iconSrc = isBeta ? images.ICONS.BETA_192 : images.ICONS.PWA_192
  const icon512Src = isBeta ? images.ICONS.BETA_512 : images.ICONS.PWA_512

  return {
    name: "Notter",
    short_name: "Notter",
    description: "Думайте, пишите, создавайте. Все это Notter",
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
