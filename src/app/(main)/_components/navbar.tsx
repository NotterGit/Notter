"use client"

import { useConvexAuth, useQuery } from "convex/react";
import { useParams } from "next/navigation";
import { api } from "../../../../convex/_generated/api";
import { MenuIcon } from "lucide-react";
import { Title } from "./title";
import { Banner } from "./banner";
import { Menu } from "./menu";
import { Publish } from "./publish";
import { useOrganization, useUser } from "@clerk/nextjs";
import type { NavbarProps } from "@/config/types/main.types";
import { isValidConvexId } from "@/lib/convex-id";

export function Navbar({ isCollapsed, onResetWidth }: NavbarProps){
    const params = useParams()
    const { user } = useUser()
    const { organization } = useOrganization()
    const { isAuthenticated } = useConvexAuth()
    const ownerId = organization?.id ?? user?.id
    const documentId = typeof params.documentId === "string" && isValidConvexId(params.documentId)
      ? params.documentId
      : null
    const document = useQuery(
      api.document.getById,
      isAuthenticated && documentId && ownerId
        ? {
            documentId,
            userId: ownerId
          }
        : "skip"
    )

    if (documentId === null) return null

    if(document === undefined){
        return (
            <nav className="mx-2 mt-2 flex w-[calc(100%-1rem)] items-center justify-between gap-x-2 rounded-2xl border border-white/60 bg-white/80 px-4 py-2 shadow-lg backdrop-blur-xl dark:border-white/10 dark:bg-zinc-950/80">
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
            <nav className="mx-2 mt-2 flex w-[calc(100%-1rem)] items-center gap-x-2 rounded-2xl border border-white/60 bg-white/80 px-4 py-2 shadow-lg backdrop-blur-xl dark:border-white/10 dark:bg-zinc-950/80 z-0">
                {isCollapsed && (
                    <button aria-label="Menu">
                        <MenuIcon
                        onClick={onResetWidth}
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
