import fs from "fs"
import path from "path"
import { bgCollectionsConfig, SUPPORTED_IMAGE_EXTENSIONS } from "@/config/const/banner-images.const"
import type { BgCollection } from "@/config/types/components.types"

const supportedImageExtensionsSet = new Set<string>(SUPPORTED_IMAGE_EXTENSIONS)

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
              return supportedImageExtensionsSet.has(ext)
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