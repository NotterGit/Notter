"use client"

import { useEffect, useState } from "react"
import dynamic from "next/dynamic"
import { useMutation, useQuery } from "convex/react"
import Link from "next/link"
import { Skeleton } from "@/components/ui/skeleton"
import { CoverBanner } from "@/components/editor/cover-banner"
import { EditorHeader } from "@/components/editor/editor-header"
import Error404 from "@/app/not-found"
import { Separator } from "@/components/ui/separator"
import { api } from "../../../../convex/_generated/api"
import { getOrgByUsername } from "@/api/org"
import { checkModerator, getUserByUsername } from "@/api/user"
import { ModeratorPanel } from "./moderatorPanel"
import { pages } from "@/config/routing/pages.route"
import type { PublicDocumentComponentProps, UserInterface } from "@/config/types/public.types"
import type { Org, User } from "@/config/types/api.types"
import { useOrganization, useUser } from "@clerk/nextjs"
import { isValidConvexId } from "@/lib/convex-id"
import { IframeModal } from "@/app/(main)/_components/iframe-modal"
import { useOrigin } from "@/components/hooks/use-origin"
import BackButton from "@/components/back-button"
import { usePublicNavbar } from "./public-layout"

const Editor = dynamic(() => import("@/components/editor"), { ssr: false })

function Footer({ name, team, logo }: UserInterface) {
  return (
    <footer className="mt-4 w-full">
      <Separator className="bg-border" />
      <p className="my-4 px-4 text-center text-sm text-muted-foreground">
        <span>Заметка создана {team ? "командой" : ""}{" "}</span>
        <Link href={pages.PROFILE(team, name)} className="font-semibold transition-colors duration-200 hover:text-foreground">
          {name}
        </Link>
        {logo && (
          <>
            <span> в</span>
            <Link className="group ml-1 font-bold opacity-60 transition-opacity duration-200 hover:opacity-100" href={pages.ROOT}>
              <span className="bg-gradient-to-r from-logo-yellow to-logo-light-yellow bg-clip-text text-transparent">Notter</span>
            </Link>
          </>
        )}
      </p>
    </footer>
  )
}

export default function DocumentIdPage({ params, iframe = false }: PublicDocumentComponentProps) {
  const origin = useOrigin()
  const isShort = params.documentId.length >= 4 && params.documentId.length <= 30
  const documentId = isValidConvexId(params.documentId) ? params.documentId : null
  const [profile, setProfile] = useState<User | Org | null>(null)
  const [isModerator, setIsModerator] = useState<boolean | undefined>(undefined)
  const { user: clerkUser } = useUser()
  const { organization } = useOrganization()
  const incrementViews = useMutation(api.document.incrementViews)
  const setNavbarLogo = usePublicNavbar()

  const document = useQuery(
    isShort ? api.document.getByShortId : api.document.getById,
    isShort
      ? {
          shortId: params.documentId,
        }
      : documentId
        ? {
            documentId,
            alwaysView: isModerator,
            userId: organization?.id ?? clerkUser?.id,
          }
        : "skip"
  )

  useEffect(() => {
    if (document?._id && document.isPublished && !document.isAcrhived) {
      incrementViews({ id: document._id })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [document?._id])

  useEffect(() => {
    const fetchProfile = async () => {
      if (!document?.creatorName) return

      const isOrg = document.userId.startsWith("org_")
      const profileData = isOrg
        ? await getOrgByUsername(document.creatorName as string)
        : await getUserByUsername(document.creatorName as string)

      setProfile(profileData)

      if (clerkUser?.id) {
        const modStatus = await checkModerator(clerkUser.id)
        setIsModerator(modStatus)
      }
    }

    fetchProfile()
  }, [document, clerkUser])

  useEffect(() => {
    setNavbarLogo(profile?.watermark !== false)

    return () => setNavbarLogo(true)
  }, [profile?.watermark, setNavbarLogo])

  useEffect(() => {
    if (!document?.title) return

    const title = `${document.title}${iframe ? " (iframe)" : ""}`
    globalThis.document.title = profile?.watermark === false ? title : `${title} | Notter`
  }, [document?.title, iframe, profile?.watermark])

  if (!isShort && documentId === null) {
    return <Error404 />
  }

  if (document === undefined) {
    if (iframe) {
      return (
        <div className="min-h-screen bg-background p-3 sm:p-6">
          <section className="mx-auto w-full max-w-5xl lg:max-w-6xl xl:max-w-7xl 2xl:max-w-[1536px] rounded-2xl border bg-card p-6 sm:p-10 space-y-6 shadow-sm">
            <Skeleton className="h-16 w-16 rounded-2xl bg-primary/8" />
            <Skeleton className="h-10 w-3/5 rounded-xl bg-primary/8" />
            <div className="space-y-3 pt-4">
              <Skeleton className="h-5 w-full rounded-full bg-primary/8" />
              <Skeleton className="h-5 w-[85%] rounded-full bg-primary/8" />
              <Skeleton className="h-5 w-[70%] rounded-full bg-primary/8" />
              <Skeleton className="h-5 w-[60%] rounded-full bg-primary/8" />
              <Skeleton className="h-5 w-[45%] rounded-full bg-primary/8" />
            </div>
          </section>
        </div>
      )
    }

    return (
      <main className="relative z-10 flex min-h-screen flex-col items-center px-3 pb-6 sm:px-6 sm:pb-8 lg:px-8 lg:pb-10 pt-20 sm:pt-24">
        <div className="relative mx-auto w-full max-w-5xl lg:max-w-6xl xl:max-w-7xl 2xl:max-w-[1536px] flex flex-col lg:flex-row items-start gap-3 lg:gap-4">
          <div className="w-full flex items-center justify-between lg:hidden">
            <BackButton />
          </div>
          <aside className="hidden lg:block shrink-0 sticky top-20 sm:top-24 z-20">
            <BackButton />
          </aside>
          <div className="flex-1 min-w-0 w-full">
            <section className="relative overflow-visible rounded-2xl border bg-card p-6 sm:p-10 space-y-6 shadow-sm">
              <Skeleton className="h-16 w-16 rounded-2xl bg-primary/8" />
              <Skeleton className="h-10 w-3/5 rounded-xl bg-primary/8" />
              <div className="space-y-3 pt-4">
                <Skeleton className="h-5 w-full rounded-full bg-primary/8" />
                <Skeleton className="h-5 w-[85%] rounded-full bg-primary/8" />
                <Skeleton className="h-5 w-[70%] rounded-full bg-primary/8" />
                <Skeleton className="h-5 w-[60%] rounded-full bg-primary/8" />
                <Skeleton className="h-5 w-[45%] rounded-full bg-primary/8" />
              </div>
            </section>
          </div>
        </div>
      </main>
    )
  }

  if ((!document?.isPublished && !isModerator) || document === null || (isShort && !document.isShort && !isModerator)) {
    return <Error404 />
  }

  const iframeUrl = pages.DOCUMENT_IFRAME_URL(origin, document._id, document.isShort, document.shortId)
  const showWatermark = profile?.watermark !== false

  if (iframe) {
    return (
      <div className="min-h-screen bg-background p-3 sm:p-6 text-foreground">
        <div className="mx-auto w-full max-w-5xl lg:max-w-6xl xl:max-w-7xl 2xl:max-w-[1536px]">
          <section className="relative overflow-visible rounded-2xl border bg-card shadow-sm transition-all">
            <CoverBanner
              coverUrl={document.coverImage ?? null}
              preview={true}
              onOpenModal={() => {}}
              onRemoveCover={() => {}}
            />

            <EditorHeader
              title={document.title}
              onChangeTitle={() => {}}
              icon={document.icon ?? null}
              onChangeIcon={() => {}}
              onRemoveIcon={() => {}}
              hasCover={Boolean(document.coverImage)}
              onAddCover={() => {}}
              preview={true}
              onEnterPress={() => {}}
            />

            <Editor
              initialContent={document.content}
              onChange={() => {}}
              editable={false}
              documentId={document._id as string}
            />

            {showWatermark && (
              <Footer
                name={document.creatorName as string}
                team={document.userId.startsWith("org_")}
                logo={profile?.watermark as boolean}
              />
            )}
          </section>
        </div>
      </div>
    )
  }

  return (
    <main className="relative z-10 flex min-h-screen flex-col items-center px-3 pb-6 sm:px-6 sm:pb-8 lg:px-8 lg:pb-10 pt-20 sm:pt-24">
      <div className="relative mx-auto w-full max-w-5xl lg:max-w-6xl xl:max-w-7xl 2xl:max-w-[1536px] flex flex-col lg:flex-row items-start gap-3 lg:gap-4">
        {/* Mobile top bar: BackButton + ModeratorPanel */}
        <div className="w-full flex items-center justify-between lg:hidden">
          <BackButton />
          {isModerator && (
            <ModeratorPanel
              _id={document._id}
              userId={document.userId}
              shortId={document.shortId}
              isShort={document.isShort}
              isPublished={document.isPublished}
              creatorName={document.creatorName}
              lastEditor={document.lastEditor}
              lastEditTime={document.lastEditTime}
              verifed={document.verifed}
              content={document.content}
              title={document.title}
              isAcrhived={document.isAcrhived}
            />
          )}
        </div>

        {/* Desktop left sidebar: sticky BackButton */}
        <aside className="hidden lg:block shrink-0 sticky top-20 sm:top-24 z-20">
          <BackButton />
        </aside>

        {/* Main note area */}
        <div className="flex-1 min-w-0 w-full">
          {isModerator && (
            <div className="hidden lg:flex justify-end mb-3">
              <ModeratorPanel
                _id={document._id}
                userId={document.userId}
                shortId={document.shortId}
                isShort={document.isShort}
                isPublished={document.isPublished}
                creatorName={document.creatorName}
                lastEditor={document.lastEditor}
                lastEditTime={document.lastEditTime}
                verifed={document.verifed}
                content={document.content}
                title={document.title}
                isAcrhived={document.isAcrhived}
              />
            </div>
          )}

          <section className="relative overflow-visible rounded-2xl border bg-card shadow-sm transition-all">
            <CoverBanner
              coverUrl={document.coverImage ?? null}
              preview={true}
              onOpenModal={() => {}}
              onRemoveCover={() => {}}
            />

            <EditorHeader
              title={document.title}
              onChangeTitle={() => {}}
              icon={document.icon ?? null}
              onChangeIcon={() => {}}
              onRemoveIcon={() => {}}
              hasCover={Boolean(document.coverImage)}
              onAddCover={() => {}}
              preview={true}
              onEnterPress={() => {}}
            />

            <Editor
              initialContent={document.content}
              onChange={() => {}}
              editable={false}
              documentId={document._id as string}
            />

            {showWatermark && (
              <Footer
                name={document.creatorName as string}
                team={document.userId.startsWith("org_")}
                logo={profile?.watermark as boolean}
              />
            )}
          </section>

          <IframeModal iframeUrl={iframeUrl} />
        </div>
      </div>
    </main>
  )
}
