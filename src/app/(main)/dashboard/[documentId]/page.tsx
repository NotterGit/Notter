"use client" 

import { use } from "react"
import dynamic from "next/dynamic" 

import { Skeleton } from "@/components/ui/skeleton" 

import { useConvexAuth, useMutation, useQuery } from "convex/react" 
import { api } from "../../../../../convex/_generated/api" 
import { Toolbar } from "@/components/toolbar" 
import { Cover } from "@/components/cover" 
import { useOrganization, useUser } from "@clerk/nextjs"
import type { DashboardDocumentIdPageProps as DocumentIdPageProps } from "@/config/types/main.types";
import Error404 from "@/app/not-found"
import { isValidConvexId } from "@/lib/convex-id"
import { getCurrentEditTime } from "@/lib/last-edit-time"

const Editor = dynamic(() => import("@/components/editor"), { ssr: false })

export default function DocumentIdPage({ params }: DocumentIdPageProps){
  const { documentId } = use(params)
  const normalizedDocumentId = isValidConvexId(documentId) ? documentId : null
  
  const { user } = useUser()
  const { organization } = useOrganization()
  const { isAuthenticated } = useConvexAuth()
  const orgId = organization?.id ?? user?.id

  const document = useQuery(
    api.document.getById,
    isAuthenticated && normalizedDocumentId && orgId
      ? {
          documentId: normalizedDocumentId,
          userId: orgId,
        }
      : "skip"
  )

  const update = useMutation(api.document.update) 
  
  const onChange = (content: string) => {
    if (!normalizedDocumentId || !orgId) {
      return
    }

    update({
      id: normalizedDocumentId,
      content,
      userId: orgId,
      lastEditor: user?.username as string,
      lastEditTime: getCurrentEditTime()
    }) 
  } 

  if (normalizedDocumentId === null) {
    return <Error404 />
  }

  if (document === undefined) {
    return (
      <div className="relative overflow-hidden pb-40 pt-14">
        <div className="pointer-events-none absolute -left-16 top-16 h-64 w-64 rounded-full bg-logo-yellow/20 blur-3xl" />
        <div className="pointer-events-none absolute -right-12 bottom-12 h-72 w-72 rounded-full bg-logo-cyan/15 blur-3xl" />
        <div className="relative z-10 mx-auto mt-28 rounded-3xl border border-white/40 bg-white/70 px-4 pb-6 dark:border-white/10 dark:bg-zinc-950/70 md:max-w-3xl lg:max-w-4xl">
          <div className="min-h-[520px] px-8 pb-6 pt-8">
            <div className="space-y-5 pl-4">
              <Skeleton className="h-18 w-18 rounded-xl bg-primary/8" />
              <Skeleton className="h-10 w-[42%] rounded-xl bg-primary/8 mt-6" />
            </div>

            <div className="mt-4 space-y-3 pl-4">
              <Skeleton className="h-5 w-[60%] rounded-full bg-primary/8" />
              <Skeleton className="h-5 w-[60%] rounded-full bg-primary/8" />
              <Skeleton className="h-5 w-[60%] rounded-full bg-primary/8" />
              <Skeleton className="h-5 w-[60%] rounded-full bg-primary/8" />
            </div>
          </div>
        </div>
      </div>
    ) 
  }

  if (document === null) {
    return <Error404 />
  }

  return (
    <div className="relative pb-40 pt-14 overflow-hidden">
      <div className="pointer-events-none absolute -left-16 top-16 h-64 w-64 rounded-full bg-logo-yellow/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-12 bottom-12 h-72 w-72 rounded-full bg-logo-cyan/15 blur-3xl" />
      <Cover url={document.coverImage} preview={document.isAcrhived ? true : false}/>
      <div className={`relative z-10 mx-auto px-4 md:max-w-3xl lg:max-w-4xl rounded-3xl border bg-white/50 border-black/10 dark:border-white/10 dark:bg-zinc-950/70 pb-6 ${document.coverImage && 'mt-6'}`}>
        <Toolbar initialData={document} preview={document.isAcrhived ? true : false}/>
        <Editor onChange={onChange} initialContent={document.content} editable={document.isAcrhived ? false : true} documentId={document._id}/>
      </div>
    </div>
  ) 
} 
