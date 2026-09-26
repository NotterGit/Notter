import type { BgCollectionConfig } from "@/config/types/components.types";

export type { BgCollectionConfig };

export const SUPPORTED_IMAGE_EXTENSIONS = [
  ".jpg",
  ".jpeg",
  ".png",
  ".svg",
  ".webp",
  ".avif",
  ".gif",
] as const;

export const bgCollectionsConfig: BgCollectionConfig[] = [
  {
    name: "Notter Qualsu",
    folder: "collection_2",
  },
  {
    name: "Vectors",
    folder: "collection_1",
  },
  {
    name: "Цвета",
    folder: "collection_colors",
  },
  {
    name: "Город и работа",
    folder: "collection_3",
  },
];

export const defaultBgImage = "/bg/collection_2/bg_2.svg";