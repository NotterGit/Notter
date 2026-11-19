import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useState, useEffect, useId, useRef } from "react"
import { toast } from "react-hot-toast"
import { Button } from "@/components/ui/button"
import { Check, Copy, Eye, Globe, Pencil, SquareArrowOutUpRight } from "lucide-react"
import { API } from "@/config/routing/api.route"
import { fetcher } from "@/lib/fetcher"
import { updateDocument } from "@/actions/update-document"
import { useAction } from "@/hooks/use-action"
import { Checkbox } from "@/components/ui/checkbox"
import { useOrigin } from "@/components/hooks/use-origin"
import { useWorkspaceAdmin } from "@/components/hooks/use-workspace-admin"
import { useOrganization, useUser } from "@clerk/nextjs"
import { getUserById, updateUser } from "@/api/user"
import { getOrgById, updateOrg } from "@/api/org"
import type { PublishProps } from "@/config/types/main.types"
import type { Org, User } from "@/config/types/api.types"
import Link from "next/link"
import { IframeModal } from "./iframe-modal"
import { pages } from "@/config/routing/pages.route"
import { getCurrentEditTime } from "@/lib/last-edit-time"

export function Publish({ initialData }: PublishProps) {
  const fieldId = useId()
  const shortIdInput = useRef<HTMLInputElement>(null)
  const origin = useOrigin()
  const queryClient = useQueryClient()
  const { user } = useUser()
  const { organization } = useOrganization()
  const { isOrg, isAdmin } = useWorkspaceAdmin()

  const orgId = (isOrg ? organization?.id : user?.id) as string

  const { execute: executeUpdate } = useAction(updateDocument, {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["document", initialData._id] })
      queryClient.invalidateQueries({ queryKey: ["workspace-limits", orgId] })
      queryClient.invalidateQueries({ queryKey: ["documents", "sidebar", orgId] })
    },
  })

  const [copied, setCopied] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [userData, setUserData] = useState<User | Org | null>(null)

  const [isShortUrl, setIsShortUrl] = useState<boolean>(Boolean(initialData.isShort))
  const [isPrivate, setIsPrivate] = useState<boolean>(Boolean(initialData.isPrivate))
  const [customShortId, setCustomShortId] = useState<string>(initialData.shortId || "")
  const [previousShortId, setPreviousShortId] = useState<string>(initialData.shortId || "")
  const [editingShortId, setEditingShortId] = useState<boolean>(false)

  useEffect(() => {
    setIsShortUrl(Boolean(initialData.isShort))
  }, [initialData.isShort])

  useEffect(() => {
    setIsPrivate(Boolean(initialData.isPrivate))
  }, [initialData.isPrivate])

  useEffect(() => {
    setPreviousShortId(initialData.shortId || "")
    setCustomShortId(initialData.shortId || "")
  }, [initialData._id, initialData.shortId])

  useEffect(() => {
    if (editingShortId) {
      shortIdInput.current?.focus()
    }
  }, [editingShortId])

  const handlePrivateChange = async (checked: boolean | "indeterminate") => {
    if (isOrg && !isAdmin) {
      toast.error("Изменять настройки публикации могут только администраторы организации")
      return
    }

    const next = checked === true
    setIsPrivate(next)
    try {
      await executeUpdate({
        id: initialData._id,
        userId: orgId,
        isPrivate: next,
        lastEditor: user?.username as string,
        lastEditTime: getCurrentEditTime(),
      })
      toast.success(next ? "Включена приватная публикация" : "Заметка отображается в профиле")
    } catch {
      setIsPrivate(!next)
      toast.error("Не удалось обновить настройку приватности")
    }
  }

  const { data: workspaceLimits } = useQuery<{
    publicDocumentCount: number
    publicDocumentLimit: number
  }>({
    queryKey: ["workspace-limits", orgId],
    queryFn: () => fetcher(API.DOCUMENTS.LIMITS(orgId)),
    enabled: Boolean(orgId),
  })
  const currentPublicDocuments = workspaceLimits?.publicDocumentCount
  const publicDocumentLimit = workspaceLimits?.publicDocumentLimit ?? 10

  const fetchUserData = async () => {
    if (!orgId) return
    const u = isOrg ? await getOrgById(orgId) : await getUserById(orgId)
    if (u) setUserData(u)
  }

  useEffect(() => {
    fetchUserData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId, isOrg])

  const handleCheckboxChange = (checked: boolean | "indeterminate") => {
    if (isOrg && !isAdmin) {
      toast.error("Изменять настройки публикации могут только администраторы организации")
      return
    }

    const next = checked === true

    if (userData?.premium === 0 && next) {
      setIsShortUrl(false)
      setCustomShortId(initialData.shortId || "")
      toast.error("Для использования коротких ссылок нужен премиум уровня 1 или 2")
      return
    }

    setIsShortUrl(next)
    setCustomShortId(initialData.shortId || "")
    setEditingShortId(false)
    executeUpdate({
      id: initialData._id,
      isPublished: initialData.isPublished,
      userId: orgId,
      lastEditor: user?.username as string,
      lastEditTime: getCurrentEditTime(),
      isShort: next,
    }).catch(() => toast.error("Не удалось обновить параметр ссылки"))
  }

  const handleCustomShortIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isOrg && !isAdmin) return
    const newShortId = e.target.value
    setCustomShortId(newShortId)
  }

  const handleValidateAndSave = async () => {
    if (isOrg && !isAdmin) {
      toast.error("Изменять ссылку могут только администраторы организации")
      setCustomShortId(previousShortId)
      return
    }

    if (customShortId === "") {
      toast.error("Ссылка не может быть пустой.")
      setCustomShortId(previousShortId)
      return
    }

    if (customShortId === previousShortId) {
      return
    }

    if (!/^[a-z0-9-]*$/i.test(customShortId) || customShortId.length < 4 || customShortId.length > 30) {
      toast.error("ShortId должен содержать от 4 до 30 символов и только буквы, цифры и дефис.")
      setCustomShortId(previousShortId)
      return
    }

    try {
      await executeUpdate({
        id: initialData._id,
        isPublished: initialData.isPublished,
        userId: orgId,
        lastEditor: user?.username as string,
        lastEditTime: getCurrentEditTime(),
        shortId: customShortId,
        isShort: true,
      })
      setPreviousShortId(customShortId)
      toast.success("Ссылка успешно обновлена!")
    } catch (error) {
      setCustomShortId(previousShortId)
      if (typeof error === "string" && error.includes("Short ID already exists")) {
        toast.error("Такая ссылка уже существует")
      } else {
        toast.error("Не удалось обновить ссылку")
      }
    }
  }

  const handleBlur = () => {
    setEditingShortId(false)
    void handleValidateAndSave()
  }

  const url = pages.DOCUMENT_URL(origin, initialData._id, isShortUrl, previousShortId)
  const iframeUrl = pages.DOCUMENT_IFRAME_URL(origin, initialData._id, isShortUrl, previousShortId)

  const onPublish = async () => {
    if (isOrg && !isAdmin) {
      toast.error("Публиковать заметки могут только администраторы организации")
      return
    }

    if (currentPublicDocuments !== undefined && currentPublicDocuments >= publicDocumentLimit) {
      toast.error(`Вы достигли лимита на публикацию в ${publicDocumentLimit} публичных заметок`)
      return
    }
    setIsSubmitting(true)
    const promise = executeUpdate({
      id: initialData._id,
      isPublished: true,
      userId: orgId,
      lastEditor: user?.username as string,
      lastEditTime: getCurrentEditTime(),
      isShort: isShortUrl,
    }).finally(() => setIsSubmitting(false))

    toast.promise(promise, {
      loading: "Публикуем...",
      success: "Заметка опубликована!",
      error: "Не удалось опубликовать",
    })
  }

  const onUnpublish = async () => {
    if (isOrg && !isAdmin) {
      toast.error("Снимать с публикации могут только администраторы организации")
      return
    }

    setIsSubmitting(true)
    const promise = executeUpdate({
      id: initialData._id,
      isPublished: false,
      userId: orgId,
      lastEditor: user?.username as string,
      lastEditTime: getCurrentEditTime(),
      isShort: isShortUrl,
    }).finally(() => setIsSubmitting(false))

    if (userData?.pined === initialData._id) {
      if (isOrg) {
        await updateOrg(orgId, { pined: "" })
      } else {
        await updateUser(orgId, { pined: "" })
      }
    }

    toast.promise(promise, {
      loading: "Отменяем публикацию...",
      success: "Заметка снята с публикации!",
      error: "Не удалось отменить публикацию",
    })
  }

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 1000)
    } catch {
      toast.error("Не удалось скопировать ссылку")
    }
  }

  const canUseShort = userData?.premium === 1 || userData?.premium === 2
  const canEditShortId = isAdmin && isShortUrl && userData?.premium === 2

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button size="sm" variant="ghost" className="h-8 rounded-lg hover:bg-black/5 dark:hover:bg-white/10">
          {initialData.isPublished ? "Публикация" : "Опубликовать"}
          {initialData.isPublished && <Globe className="h-4 w-4 text-sky-500" aria-hidden="true" />}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="max-h-[var(--radix-popover-content-available-height)] w-80 max-w-[calc(100vw-1.5rem)] overflow-y-auto rounded-2xl border-0 bg-white/95 p-4 shadow-xl backdrop-blur-xl dark:bg-zinc-950/95"
        align="end"
        aria-label="Публикация заметки"
        onInteractOutside={(event) => {
          if (event.target instanceof Element && event.target.closest("[data-embed-dialog]")) {
            event.preventDefault()
          }
        }}
      >
        {initialData.isPublished ? (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="flex items-center gap-2 text-sm font-medium text-sky-500">
                <Globe className="h-4 w-4" aria-hidden="true" /> Опубликовано
              </p>
              <span className="inline-flex items-center gap-1 text-xs tabular-nums text-sky-700 dark:text-sky-200">
                <Eye className="h-4 w-4" aria-hidden="true" /> Просмотров: {initialData.views ?? 0}
              </span>
            </div>

            <div className="flex min-w-0 items-center gap-1 rounded-lg bg-muted/40">
              {editingShortId ? (
                <input
                  ref={shortIdInput}
                  value={customShortId}
                  onBlur={handleBlur}
                  onChange={handleCustomShortIdChange}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault()
                      event.currentTarget.blur()
                    }
                  }}
                  aria-label="Короткий адрес"
                  className="h-10 min-w-0 flex-1 rounded-lg bg-transparent px-3 text-base focus-visible:ring-2 focus-visible:ring-ring sm:text-sm"
                />
              ) : (
                <input
                  value={url}
                  readOnly
                  aria-label="Ссылка на заметку"
                  className="h-10 min-w-0 flex-1 truncate rounded-lg bg-transparent px-3 text-base focus-visible:ring-2 focus-visible:ring-ring sm:text-sm"
                />
              )}
              {canEditShortId && !editingShortId && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 shrink-0"
                  aria-label="Изменить короткий адрес"
                  onClick={() => setEditingShortId(true)}
                >
                  <Pencil aria-hidden="true" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 shrink-0"
                onClick={onCopy}
                aria-label={copied ? "Ссылка скопирована" : "Копировать ссылку"}
              >
                {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
              </Button>
            </div>

            <div className="space-y-1">
              <label className="flex min-h-9 items-center gap-2 text-sm">
                <Checkbox
                  checked={isPrivate}
                  onCheckedChange={handlePrivateChange}
                  disabled={!isAdmin || isSubmitting}
                  aria-describedby={`${fieldId}-privacy`}
                />
                Приватная публикация
              </label>
              <p id={`${fieldId}-privacy`} className="text-xs text-muted-foreground">
                Доступна по ссылке. Скрыта из профиля и публикуется без имени автора.
              </p>
              <label className="flex min-h-9 items-center gap-2 text-sm">
                <Checkbox
                  checked={isShortUrl}
                  onCheckedChange={handleCheckboxChange}
                  disabled={!isAdmin || !canUseShort || isSubmitting}
                />
                Сократить ссылку
                {!canUseShort && userData && <span className="ml-auto text-xs text-muted-foreground">От Amber</span>}
              </label>
            </div>

            <div className="flex flex-wrap items-center gap-1 border-t border-border/40 pt-2">
              <Button asChild variant="ghost" size="sm" className="h-9">
                <Link href={url} target="_blank" rel="noopener noreferrer">
                  <SquareArrowOutUpRight aria-hidden="true" /> Открыть
                </Link>
              </Button>
              <IframeModal iframeUrl={iframeUrl} compact />
            </div>

            {isAdmin && (
              <Button
                size="sm"
                variant="secondary"
                className="h-9 w-full rounded-xl"
                disabled={isSubmitting}
                onClick={onUnpublish}
              >
                Снять с публикации
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {isAdmin
                ? "После публикации заметку сможет открыть любой, у кого есть ссылка."
                : "Публиковать могут только администраторы организации."}
            </p>
            {isAdmin && (
              <Button disabled={isSubmitting} onClick={onPublish} className="h-9 w-full rounded-xl" size="sm">
                Опубликовать
              </Button>
            )}
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
