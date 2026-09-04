"use client"

import Image from "next/image"
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"
import { useMutation } from "convex/react"
import { api } from "../../../../convex/_generated/api"
import { toast } from "react-hot-toast"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { useOrganization, useUser } from "@clerk/nextjs"
import { pages } from "@/config/routing/pages.route"
import { images } from "@/config/routing/image.route"
import { getCurrentEditTime } from "@/lib/last-edit-time"
import { createDocumentWithFallback, getCreateDocumentErrorMessage, getCreateDocumentLimitOptions } from "@/api/document-limit"

export default function Dashboard() {
    const create = useMutation(api.document.create)
    const router = useRouter()
    const { user } = useUser()
    const { organization } = useOrganization()
    const isOrg = organization?.id !== undefined
    const orgId = isOrg ? organization?.id as string : user?.id as string
    
    useEffect(() => {
        const orgName = organization?.name || organization?.slug
        const fullName = user?.fullName?.trim() || `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim()
        const username = user?.username?.trim()
        const displayName = (isOrg ? orgName : (fullName || username)) || orgName || fullName || username

        if (displayName) {
            globalThis.document.title = `${displayName} | Notter`
        }
    }, [isOrg, organization?.slug, organization?.name, user?.fullName, user?.firstName, user?.lastName, user?.username])
    
    const onCreate = () => {
        const promise = getCreateDocumentLimitOptions(orgId, isOrg)
            .then((limitOptions) => createDocumentWithFallback(create, { 
                title: "Новая заметка",
                userId: orgId,
                creatorName: isOrg ? organization?.slug as string : user?.username as string,
                lastEditor: user?.username as string,
                lastEditTime: getCurrentEditTime(),
                ...limitOptions,
            }))
            .then((documentId) => {
                router.push(pages.DASHBOARD(documentId));
                return documentId
            })
        
        toast.promise(promise, {
            loading: "Создание заметки...",
            success: "Заметка успешно создана!",
            error: getCreateDocumentErrorMessage
        })
    }
    
    
    return (
        <div className="relative flex h-full items-center justify-center overflow-hidden px-4 py-6 sm:px-8">
            <div className="pointer-events-none absolute -left-16 top-16 h-64 w-64 rounded-full bg-logo-yellow/20 blur-3xl" />
            <div className="pointer-events-none absolute -right-12 bottom-12 h-72 w-72 rounded-full bg-logo-cyan/15 blur-3xl" />
            <section className="relative z-10 w-full max-w-3xl rounded-3xl border border-white/40 bg-white/70 p-6 text-center shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-zinc-950/70 sm:p-10">
                <div className="mx-auto mb-4 inline-flex rounded-2xl border border-logo-yellow/30 bg-logo-yellow/10 px-3 py-1 text-xs font-semibold tracking-wide text-foreground/80">
                    Welcome to Notter
                </div>
                <Image 
                    src={images.ILLUSTRATIONS.EMPTY}
                    width={360}
                    height={360}
                    alt="Empty"
                    className="mx-auto w-full max-w-[320px] sm:max-w-[360px] drop-shadow-[0_0_10px_rgba(0,0,0,0.5)] dark:drop-shadow-[0_0_10px_rgba(255,255,255,0.2)] p-8"
                />
                <h2 className="mt-4 text-2xl font-semibold sm:text-3xl">
                    Пока что тут ничего нет
                </h2>
                <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground sm:text-base">
                    Создайте первую заметку и начните строить личную или командную базу знаний в новом интерфейсе
                </p>
                <Button onClick={onCreate} className="mt-6 h-10 rounded-xl px-5 text-sm font-semibold sm:h-11 sm:text-base">
                    <PlusCircle className="h-4 w-4"/>
                    Создать заметку
                </Button>
            </section>
        </div>
    )
}
