"use client"

import { cn } from "@/lib/utils"
import { Check, ChevronsLeft, Download, File, MenuIcon, MonitorSmartphoneIcon, Search, Settings2 } from "lucide-react"

import { useParams, useRouter } from "next/navigation"
import { ElementRef, useEffect, useRef, useState } from "react"
import { useMediaQuery } from 'usehooks-ts'
import { useMutation } from "convex/react"
import { api } from "../../../../convex/_generated/api"
import { getUserById } from "@/api/user"
import { getOrgById } from "@/api/org"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "react-hot-toast"
import { useOrganization, useUser } from "@clerk/clerk-react"
import { InstallModal } from "@/components/modal/install-modal"
import { UserItem } from "./user-item"
import { Item } from "./item"
import { DocumentList } from "./document-list"
import { useSearch } from "../../../components/hooks/use-search"
import { useSettings } from "../../../components/hooks/use-settings"
import { Navbar } from "./navbar"
import Link from "next/link"
import { pages } from "@/config/routing/pages.route"
import { getCurrentEditTime } from "@/lib/last-edit-time"
import { createDocumentWithFallback, getCreateDocumentErrorMessage } from "@/api/document-limit"
import { getPlanLimits } from "@/lib/plan-limits"
import type { BeforeInstallPromptEvent } from "@/config/types/components.types"
import {
    getIsPwaInstalled,
    getPwaPromptInstall,
    installPwaFromBrowser,
    subscribePwaInstalled,
    subscribePwaPromptInstall,
} from "@/lib/pwa-install"
import { links } from "@/config/routing/links.route"

export function Navigation() {
    const router = useRouter()
    const settings = useSettings()

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            const isSettingsKey = e.code === "KeyK" || e.key?.toLowerCase() === "k"

            if ((e.ctrlKey || e.metaKey) && isSettingsKey) {
                e.preventDefault()
                settings.onOpen()
            }
        }

        if (typeof window !== "undefined") {
            window.addEventListener("keydown", handler)
        }

        return () => {
            if (typeof window !== "undefined") {
                window.removeEventListener("keydown", handler)
            }
        }
    }, [settings])

    const seacrh = useSearch()
    const params = useParams()
    const { user } = useUser()
    const { organization } = useOrganization()
    const isMobile = useMediaQuery("(max-width: 768px)")
    const create = useMutation(api.document.create)
    const isOrg = organization?.id !== undefined
    const orgId = isOrg ? organization?.id as string : user?.id as string

    const isResizingRef = useRef(false)
    const sidebarRef = useRef<ElementRef<"aside">>(null)
    const navbarRef = useRef<ElementRef<"div">>(null)
    const [isResetting, setIsResetting] = useState(false)
    const [isCollapsed, setIsCollapsed] = useState(isMobile)

    const [documentCount, setDocumentCount] = useState<number>(0)
    const [documentPublicCount, setDocumentPublicCount] = useState<number>(0)
    const [premiumLevel, setPremiumLevel] = useState<number>(0)
    const [isLimitsLoading, setIsLimitsLoading] = useState<boolean>(true)
    const [promptInstall, setPromptInstall] = useState<BeforeInstallPromptEvent | null>(null)
    const [isInstalled, setIsInstalled] = useState(false)
    const [isInstallModalOpen, setIsInstallModalOpen] = useState(false)

    useEffect(() => {
        setPromptInstall(getPwaPromptInstall())
        setIsInstalled(getIsPwaInstalled())

        const unsubscribePrompt = subscribePwaPromptInstall(setPromptInstall)
        const unsubscribeInstalled = subscribePwaInstalled((installed) => {
            setIsInstalled(installed)
            if (installed) {
                setIsInstallModalOpen(false)
            }
        })

        return () => {
            unsubscribePrompt()
            unsubscribeInstalled()
        }
    }, [])

    useEffect(() => {
        let isMounted = true

        const fetchData = async () => {
            setIsLimitsLoading(true)

            try {
                if (isOrg && organization?.id) {
                    const orgData = await getOrgById(organization.id)
                    if (orgData && isMounted) {
                        setDocumentCount(orgData.documents || 0)
                        setDocumentPublicCount(orgData.publicDocuments || 0)
                        setPremiumLevel(orgData.premium || 0)
                    }
                    return
                }

                if (!isOrg && user?.id) {
                    const userData = await getUserById(user.id)
                    if (userData && isMounted) {
                        setDocumentCount(userData.documents || 0)
                        setDocumentPublicCount(userData.publicDocuments || 0)
                        setPremiumLevel(userData.premium || 0)
                    }
                }
            } catch {

            } finally {
                if (isMounted) {
                    setIsLimitsLoading((isOrg && !organization?.id) || (!isOrg && !user?.id))
                }
            }
        }

        fetchData()

        return () => {
            isMounted = false
        }
    }, [isOrg, organization?.id, user?.id])

    useEffect(() => {
        if (isMobile && params.documentId) {
            collapse()
        }
    }, [isMobile, params.documentId])

    const { 
        documents: documentLimit, 
        publicDocuments: publicDocumentLimit 
    } = getPlanLimits(premiumLevel, isOrg)

    const documentProgress = (documentCount / documentLimit) * 100
    const publicDocumentProgress = (documentPublicCount / publicDocumentLimit) * 100

    const getProgressColor = (progress: number) => {
        if (progress >= 95) return "[&>div]:bg-red-600"
        if (progress >= 75) return "[&>div]:bg-yellow-500"
        return ""
    }

    const handleCreate = () => {
        const promise = createDocumentWithFallback(create, {
            title: "Новая заметка",
            userId: orgId,
            lastEditor: user?.username as string,
            creatorName: isOrg ? organization?.slug as string : user?.username as string,
            lastEditTime: getCurrentEditTime(),
            premiumLevel,
            isOrg,
        })
            .then((documentId) => {
                router.push(pages.DASHBOARD(documentId))
                return documentId
            })

        toast.promise(promise, {
            loading: "Создание заметки...",
            success: "Заметка успешно создана!",
            error: getCreateDocumentErrorMessage
        })
    }

    const installPwa = async () => {
        const accepted = await installPwaFromBrowser()

        if (accepted) {
            setIsInstallModalOpen(false)
        }
    }

    const handleMouseDown = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        event.preventDefault()
        event.stopPropagation()

        isResizingRef.current = true
        document.addEventListener("mousemove", handleMouseMove)
        document.addEventListener("mouseup", handleMouseUp)
    }

    const handleMouseMove = (event: MouseEvent) => {
        if (!isResizingRef.current) return
        let newWidth = event.clientX

        if (newWidth < 240) newWidth = 240
        if (newWidth > 480) newWidth = 480

        if (sidebarRef.current && navbarRef.current) {
            sidebarRef.current.style.width = `${newWidth}px`
            navbarRef.current.style.setProperty("left", `${newWidth}px`)
            navbarRef.current.style.setProperty("width", `calc(100% - ${newWidth}px)`)
        }
    }

    const handleMouseUp = () => {
        isResizingRef.current = false
        document.removeEventListener("mousemove", handleMouseMove)
        document.removeEventListener("mouseup", handleMouseUp)
    }

    const resetWidth = () => {
        if (sidebarRef.current && navbarRef.current) {
            setIsCollapsed(false)
            setIsResetting(true)

            sidebarRef.current.style.width = isMobile ? "100%" : "240px"
            navbarRef.current.style.setProperty("width", isMobile ? "0" : "")
            navbarRef.current.style.setProperty("left", isMobile ? "100%" : "240px")
            setTimeout(() => setIsResetting(false), 300)
        }
    }

    const collapse = () => {
        if (sidebarRef.current && navbarRef.current) {
            setIsCollapsed(true)
            setIsResetting(true)

            sidebarRef.current.style.width = "0"
            navbarRef.current.style.setProperty("width", "100%")
            navbarRef.current.style.setProperty("left", "0")
            setTimeout(() => setIsResetting(false), 300)
        }
    }

    return (
        <>
            <aside ref={sidebarRef} className={cn(
                "group/sidebar relative z-50 flex h-full w-60 flex-col overflow-hidden border-r border-white/50 bg-white/65 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-zinc-950/70",
                isResetting && "transition-all ease-in-out duration-300",
                isMobile && "w-0"
            )}>
                <div className="h-full overflow-y-auto custom-scrollbar">
                    <div onClick={collapse} role="button" className={cn(
                        "absolute right-0.5 top-3 flex h-7 w-7 items-center justify-center rounded-lg border border-transparent text-muted-foreground opacity-0 transition hover:border-border hover:bg-background/70 group-hover/sidebar:opacity-100",
                        isMobile && "opacity-100"
                    )}>
                        <ChevronsLeft className="h-4 w-4" />
                    </div>

                    <div className="border-b border-black/5 px-2 pb-3 pt-2 dark:border-white/10">
                        <UserItem />
                        <Item label="Поиск" icon={Search} isSearch onClick={seacrh.onOpen} />
                        <Item label="Настройки" icon={Settings2} onClick={settings.onOpen} shortcut="k" />
                        {!isInstalled ? (
                            <>
                                <Item label="Перейти в ToDo" icon={Check} onClick={() => {router.push(links.TODO_DASHBOARD)}} hasArrow />

                                <Item label="Скачать приложение" icon={Download} onClick={() => {
                                    if (isMobile) {
                                        void installPwa()
                                        return
                                    }

                                    setIsInstallModalOpen(true)
                                }} />
                            </>
                        ) : null}
                        <Item onClick={handleCreate} label="Новая заметка" icon={File} />

                    </div>

                    <div className="mt-2 px-2">
                        <DocumentList onCreateDocument={handleCreate} />
                    </div>

                    <div className="mx-3 mt-4 rounded-2xl border border-black/5 bg-background/60 p-3 dark:border-white/10 dark:bg-zinc-900/60">
                        <div className="text-xs uppercase tracking-wide text-muted-foreground">
                            Лимиты пространства
                        </div>
                        {isLimitsLoading ? (
                            <div className="mt-3 space-y-2">
                                <div>
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <span className="font-semibold text-foreground text-sm">Заметки:</span>
                                        <Skeleton className="h-4 w-14 rounded-full bg-primary/8" />
                                    </div>
                                    <Skeleton className="mt-2 h-3 w-full rounded-2xl bg-primary/8" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold text-foreground text-sm">Публичные:</span>
                                        <Skeleton className="h-4 w-14 rounded-full bg-primary/8" />
                                    </div>
                                    <Skeleton className="mt-2 h-3 w-full rounded-2xl bg-primary/8" />
                                </div>
                                <Link className="text-sm text-primary/50 hover:text-primary transition-colors duration-200" href={pages.BUY}>
                                    Увеличить лимиты
                                </Link>
                            </div>
                        ) : (
                            <>
                                <div className="mt-3 text-sm text-muted-foreground">
                                    <span className="font-semibold text-foreground">Заметки:</span> {documentCount}/{documentLimit}
                                </div>
                                <Progress value={documentProgress} max={100} className={`mt-2 h-2 ${getProgressColor(documentProgress)}`} />

                                <div className="mt-4 text-sm text-muted-foreground">
                                    <span className="font-semibold text-foreground">Публичные:</span> {documentPublicCount}/{publicDocumentLimit}
                                </div>
                                <Progress value={publicDocumentProgress} max={100} className={`mt-2 h-2 ${getProgressColor(publicDocumentProgress)}`} />

                                {(documentCount >= documentLimit || documentPublicCount >= publicDocumentLimit) ? (
                                    <div className="mt-3 rounded-xl border border-red-300/50 bg-red-50/70 p-2 text-xs text-red-700 dark:border-red-400/20 dark:bg-red-950/40 dark:text-red-200">
                                        <span>Достигнут лимит по заметкам. Оформите{" "}</span>
                                        <Link href={pages.BUY} className="group inline-flex transition-all duration-300">
                                            <span className="group-hover:text-logo-yellow transition-colors duration-300 mr-0.5">Notter</span>
                                            <span className="group-hover:text-logo-cyan transition-colors duration-300">Gem</span>
                                        </Link>
                                    </div>
                                ) : (
                                    <div className="mt-2">
                                        <Link className="text-sm text-primary/50 hover:text-primary transition-colors duration-200" href={pages.BUY}>
                                            Увеличить лимиты
                                        </Link>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
                <div onMouseDown={handleMouseDown} onClick={resetWidth} className="absolute right-0 top-0 h-full w-1 cursor-ew-resize bg-transparent opacity-0 transition group-hover/sidebar:opacity-100 resize-handle" />
            </aside>

            <div ref={navbarRef} className={cn(
                "absolute left-60 top-0 z-[99999] w-[calc(100%-240px)]",
                isResetting && "transition-all ease-in-out duration-300",
                isMobile && "left-0 w-full"
            )}>
                {!!params.documentId ? (
                    <Navbar isCollapsed={isCollapsed} onResetWidth={resetWidth} />
                ) : (
                    <nav className="w-full px-4 py-3">
                        {isCollapsed && <MenuIcon onClick={resetWidth} role="button" className="h-6 w-6 rounded-md p-1 text-muted-foreground hover:bg-background/70" />}
                    </nav>
                )}
            </div>

            <InstallModal
                open={isInstallModalOpen}
                onOpenChange={setIsInstallModalOpen}
                onInstallPwa={installPwa}
                canInstallPwa={Boolean(promptInstall)}
            />
        </>
    )
}
