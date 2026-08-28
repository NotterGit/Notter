import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { useMutation, useQuery } from "convex/react"
import { useState, useEffect } from "react"
import { toast } from "react-hot-toast"
import { Button } from "@/components/ui/button"
import { Check, Copy, Eye, Globe } from "lucide-react"
import { api } from "../../../../convex/_generated/api"
import { Checkbox } from "@/components/ui/checkbox"
import { Hint } from "@/components/ui/hint"
import { useOrigin } from "../../../components/hooks/use-origin"
import { useWorkspaceAdmin } from "@/components/hooks/use-workspace-admin"
import { useOrganization, useUser } from "@clerk/nextjs"
import { getById as getUserByID, updateUser } from "../../api/users/user"
import { getById as getOrgByID, updateOrg } from "../../api/orgs/org"
import type { PublishProps } from "@/config/types/main.types"
import type { Org, User } from "@/config/types/api.types"
import Link from "next/link"
import { IframeModal } from "./iframe-modal"
import { pages } from "@/config/routing/pages.route"
import { getCurrentEditTime } from "@/lib/last-edit-time"
import { getPublicDocumentLimit } from "@/lib/plan-limits"

export function Publish({ initialData }: PublishProps) {
  const origin = useOrigin()
  const update = useMutation(api.document.update)
  const { user } = useUser()
  const { organization } = useOrganization()
  const { isOrg, isAdmin } = useWorkspaceAdmin()

  const orgId = (isOrg ? organization?.id : user?.id) as string

  const [copied, setCopied] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [publicDocumentLimit, setPublicDocumentLimit] = useState<number>(getPublicDocumentLimit(0, isOrg))
  const [userData, setUserData] = useState<User | Org | null>(null)

  const [isShortUrl, setIsShortUrl] = useState<boolean>(Boolean(initialData.isShort))
  const [customShortId, setCustomShortId] = useState<string>(initialData.shortId || "")
  const [previousShortId, setPreviousShortId] = useState<string>(initialData.shortId || "")
  const [editingShortId, setEditingShortId] = useState<boolean>(false)

  useEffect(() => {
    setIsShortUrl(Boolean(initialData.isShort))
  }, [initialData.isShort])

  const currentPublicDocuments = useQuery(api.document.getPublicDocumentCount, {
    userId: orgId,
  })

  const fetchUserData = async () => {
    if (!orgId) return
    const u = isOrg ? await getOrgByID(orgId) : await getUserByID(orgId)
    if (u) {
      setUserData(u)
      setPublicDocumentLimit(getPublicDocumentLimit(u.premium, isOrg))
    }
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
      setCustomShortId(initialData.shortId)
      toast.error("Для использования коротких ссылок нужен премиум уровня 1 или 2")
      return
    }

    setIsShortUrl(next)
    setCustomShortId(initialData.shortId)
    setEditingShortId(false)
    update({
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

    setPreviousShortId(customShortId)
    try {
      await update({
        id: initialData._id,
        isPublished: initialData.isPublished,
        userId: orgId,
        lastEditor: user?.username as string,
        lastEditTime: getCurrentEditTime(),
        shortId: customShortId,
        isShort: true,
      })
      toast.success("Ссылка успешно обновлена!")
    } catch (error: any) {
      if (error.message.includes("Short ID already exists")) {
        toast.error("Такая ссылка уже существует")
        setCustomShortId(previousShortId)
      } else {
        toast.error("Не удалось обновить ссылку")
      }
    }
  }

  const handleBlur = () => {
    if (isOrg && !isAdmin) return
    setEditingShortId(false)
    handleValidateAndSave()

    if (customShortId !== previousShortId) {
      toast.success("Ссылка успешно обновлена!")
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleValidateAndSave()
    }
  }

  const url = pages.DOCUMENT_URL(origin, initialData._id, isShortUrl, customShortId)
  const iframeUrl = pages.DOCUMENT_IFRAME_URL(origin, initialData._id, isShortUrl, customShortId)

  const onPublish = async () => {
    if (isOrg && !isAdmin) {
      toast.error("Публиковать заметки могут только администраторы организации")
      return
    }

    if (currentPublicDocuments !== undefined && (currentPublicDocuments as number) >= publicDocumentLimit) {
      toast.error(`Вы достигли лимита на публикацию в ${publicDocumentLimit} публичных заметок`)
      return
    }
    setIsSubmitting(true)
    const promise = update({
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
    const promise = update({
      id: initialData._id,
      isPublished: false,
      userId: orgId,
      lastEditor: user?.username as string,
      lastEditTime: getCurrentEditTime(),
      isShort: isShortUrl,
    }).finally(() => setIsSubmitting(false))

    if (userData?.pined === initialData._id) {
      if (isOrg) {
        await updateOrg(orgId, null, null, null, null, null, "")
      } else {
        await updateUser(orgId, null, null, null, null, null, "")
      }
    }

    toast.promise(promise, {
      loading: "Отменяем публикацию...",
      success: "Заметка снята с публикации!",
      error: "Не удалось отменить публикацию",
    })
  }

  const onCopy = () => {
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 1000)
  }

  const canUseShort = userData?.premium === 1 || userData?.premium === 2
  const canUseCustomShort = userData?.premium === 2

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button size="sm" variant="ghost" className="h-8 rounded-lg hover:bg-black/5 dark:hover:bg-white/10">
          Опубликовать
          {initialData.isPublished && <Globe className="h-4 w-4 text-sky-500" />}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 rounded-2xl border-white/60 bg-white/95 p-4 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-zinc-950/95" align="end" alignOffset={8} forceMount>
        {initialData.isPublished ? (
          <div className="space-y-4">
            <div className="flex items-center gap-x-2">
              <Globe className="h-4 w-4 text-sky-500" />
              <p className="text-xs font-medium text-sky-500">
                Эта заметка находится в открытом доступе
              </p>
            </div>

            <div className="flex items-center">
              <input
                value={editingShortId ? customShortId : url}
                className="h-9 flex-1 rounded-l-lg border border-border/60 bg-background/70 px-3 text-xs"
                onClick={() => {
                  if (isAdmin && isShortUrl && canUseCustomShort) {
                    setEditingShortId(true)
                  }
                }}
                onBlur={handleBlur}
                onChange={handleCustomShortIdChange}
                onKeyPress={handleKeyPress}
                autoFocus
                disabled={!isAdmin || !isShortUrl || !canUseCustomShort}
              />
              <Button onClick={onCopy} disabled={copied} className="h-9 rounded-l-none rounded-r-lg px-3">
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>

            <span className="inline-flex items-center gap-1 rounded-full bg-sky-500/10 px-2 py-1 text-xs text-sky-700 dark:text-sky-200">
              <Eye className="w-4 h-4" /> Просмотров: {initialData.views ?? 0}
            </span>

            {!canUseShort ? (
              <Hint
                side="bottom"
                sideOffset={4}
                description="Доступно с тарифа Amber"
              >
                <div className="flex items-center rounded-lg border border-border/60 bg-background/60 px-2.5 py-2 cursor-not-allowed">
                  <Checkbox
                    checked={isShortUrl}
                    onCheckedChange={handleCheckboxChange}
                    disabled={!isAdmin || !canUseShort}
                  />
                  <p className="ml-1 text-xs select-none">
                    Сократить ссылку
                  </p>
                </div>
              </Hint>
            ) : (
              <div className="flex items-center rounded-lg border border-border/60 bg-background/60 px-2.5 py-2">
                <Checkbox
                  checked={isShortUrl}
                  onCheckedChange={handleCheckboxChange}
                  disabled={!isAdmin}
                />
                <p className="ml-1 text-xs select-none">
                  Сократить ссылку
                </p>
              </div>
            )}

            {isAdmin && (
              <Button
                size="sm"
                className="h-9 w-full rounded-xl text-xs"
                disabled={isSubmitting}
                onClick={onUnpublish}
              >
                Отменить публикацию
              </Button>
            )}

            <Link href={url} target="_blank">
              <Button
                className="h-9 w-full rounded-xl text-xs"
                size="sm"
                variant="outline"
              >
                Перейти
              </Button>
            </Link>

            <IframeModal iframeUrl={iframeUrl} />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/70 bg-background/50 p-4 text-center">
            <Globe className="mb-2 h-8 w-8 text-muted-foreground" />
            <p className="font-medium">Поделитесь своей заметкой</p>
            {isAdmin ? (
              <>
                <span className="mb-2 text-xs text-muted-foreground">
                  Поделитесь своими мыслями с другими
                </span>
                <Button
                  disabled={isSubmitting}
                  onClick={onPublish}
                  className="h-9 w-full rounded-xl text-xs"
                  size="sm"
                >
                  Опубликовать
                </Button>
              </>
            ) : (
              <span className="text-center w-full block text-[0.7rem] text-muted-foreground mt-2">
                Публиковать могут только администраторы организации
              </span>
            )}
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}

