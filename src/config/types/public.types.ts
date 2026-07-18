import type { Id } from "../../../convex/_generated/dataModel"

export interface PublicDocumentComponentProps {
  params: {
    documentId: string
  }
  iframe?: boolean
}

export interface UserInterface {
  name: string
  team: boolean
  logo: boolean
}

export interface ModeratorPanelDocumentProps {
  _id: Id<"documents">;
  userId: string;
  title: string;
  shortId?: string;
  isShort?: boolean;
  isPublished: boolean;
  isAcrhived?: boolean;
  creatorName?: string;
  lastEditor?: string;
  lastEditTime?: string;
  verifed?: boolean;
  content?: string;
}

export interface DocumentIdPageProps {
  params: Promise<{
    documentId: string
  }>
}
