import type { Metadata } from "next"

import type { DocumentIdPageProps } from "@/config/types/public.types"
import { createPublicTitleMetadata, getPublicDocumentMetadata } from "../_lib/public-document-metadata"

import DocumentIdPage from "../_components/document"

export async function generateMetadata({ params }: DocumentIdPageProps): Promise<Metadata> {
  const resolvedParams = await params
  const metadata = await getPublicDocumentMetadata(resolvedParams.documentId)

  return createPublicTitleMetadata(metadata, "Публичная заметка")
}

export default async function Page({ params }: DocumentIdPageProps) {
  const resolvedParams = await params

  return <DocumentIdPage params={resolvedParams} />
}
