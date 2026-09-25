import fs from "fs"
import path from "path"
import { bgCollectionsConfig } from "@/config/const/banner-images.const"
import type { BgCollection } from "@/config/types/components.types"

const SUPPORTED_IMAGE_EXTENSIONS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".svg",
  ".webp",
  ".avif",
  ".gif",
])

export function getBackgroundCollections(): BgCollection[] {
  const publicBgPath = path.join(process.cwd(), "public", "bg")

  return bgCollectionsConfig
    .map((collection) => {
      const collectionDirPath = path.join(publicBgPath, collection.folder)
      let images: string[] = []

      if (fs.existsSync(collectionDirPath)) {
        try {
          const files = fs.readdirSync(collectionDirPath)
          images = files
            .filter((file) => {
              const ext = path.extname(file).toLowerCase()
              return SUPPORTED_IMAGE_EXTENSIONS.has(ext)
            })
            .sort((a, b) =>
              a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" })
            )
            .map((file) => `/bg/${collection.folder}/${file}`)
        } catch (error) {
          console.error(`[GET_BACKGROUNDS_ERROR] Error reading directory ${collectionDirPath}:`, error)
        }
      }

      return {
        name: collection.name,
        folder: collection.folder,
        images,
      }
    })
    .filter((collection) => collection.images.length > 0)
}