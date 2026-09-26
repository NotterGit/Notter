export interface BgCollectionConfig {
  name: string;
  folder: string;
}

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