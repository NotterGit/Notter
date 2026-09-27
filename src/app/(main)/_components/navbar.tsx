"use client"

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { API } from "@/config/routing/api.route";
import { fetcher } from "@/lib/fetcher";
import { MenuIcon } from "lucide-react";
import { Title } from "./title";
import { Banner } from "./banner";
import { Menu } from "./menu";
import { Publish } from "./publish";
import { useAuth, useOrganization, useUser } from "@clerk/nextjs";
import type { NavbarProps } from "@/config/types/main.types";
import { isValidDocumentId } from "@/lib/document-id";

export function Navbar({ isCollapsed, onResetWidth }: NavbarProps){
    const params = useParams()
    const { user } = useUser()
    const { organization } = useOrganization()
    const { isSignedIn } = useAuth()
    const ownerId = organization?.id ?? user?.id
    const documentId = typeof params.documentId === "string" && isValidDocumentId(params.documentId)
      ? params.documentId
      : null
    const { data: document, isLoading } = useQuery<any>({
      queryKey: ["document", documentId],
      queryFn: () => fetcher(API.DOCUMENTS.BY_ID(documentId!, { userId: ownerId })),
      enabled: Boolean(isSignedIn && documentId && ownerId),
    })

    if (documentId === null) return null

    if (isLoading || document === undefined) {
        return (
            <nav className="flex h-12 w-full items-center justify-between gap-x-2 border-b border-black/5 bg-background/80 px-4 backdrop-blur-md dark:border-white/10 dark:bg-zinc-950/80">
                <Title.Skeleton/>
                <div className="flex items-center gap-x-2">
                    <Menu.Skeleton/>
                </div>
            </nav>
        )
    }

    if (document === null) return null
    
    return (
        <>
            <nav className="flex h-12 w-full items-center gap-x-2 border-b border-black/5 bg-background/80 px-4 backdrop-blur-md dark:border-white/10 dark:bg-zinc-950/80">
                {isCollapsed && (
                    <button
                        aria-label="Menu"
                        onClick={onResetWidth}
                        className="cursor-pointer"
                    >
                        <MenuIcon
                            className="h-6 w-6 rounded-md p-1 text-muted-foreground hover:bg-background/70"
                        />
                    </button>
                )}
                <div className="flex w-full items-center justify-between">
                    <Title initialData={document} />
                    <div className="flex items-center gap-x-2 justify-between">
                        {!document.isAcrhived && (
                            <Publish initialData={document} />
                        )}
                        <Menu documentId={document._id} />
                    </div>
                </div>
            </nav>
            {document.isAcrhived && <Banner documentId={document._id} />}
        </>
    )
}
