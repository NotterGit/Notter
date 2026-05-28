"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useOrganization, useUser } from "@clerk/nextjs"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import toast from "react-hot-toast"
import { Button } from "@/components/ui/button"
import { pages } from "@/config/routing/pages.route"
import { checkOrder } from "../../api/order/order"
import { CheckStatus, statusClassName, statusLabel, statusMessage, toastMessage } from "@/config/const/buy.const"

const getOrderStatus = (status: string): CheckStatus => {
  if (status === "success") return "success"
  if (status === "pending") return "pending"
  if (status === "cancel") return "cancel"
  return "failed"
}

export function CheckBuyClient() {
  const searchParams = useSearchParams()
  const merchantOrderId =
    searchParams.get("MERCHANT_ORDER_ID") ?? searchParams.get("MerchantOrderId")
  const [status, setStatus] = useState<CheckStatus>("loading")
  const { user, isLoaded: isUserLoaded } = useUser()
  const { organization, isLoaded: isOrganizationLoaded } = useOrganization()
  const shownToastRef = useRef<CheckStatus | null>(null)

  const isLoading = status === "loading"
  const canRetry = !isLoading && status !== "success" && status !== "cancel" && status !== "foreign"

  const ownerIds = useMemo(() => {
    return [user?.id, organization?.id].filter(Boolean)
  }, [organization?.id, user?.id])

  const showToast = useCallback((nextStatus: CheckStatus) => {
    const message = toastMessage[nextStatus]
    if (!message || shownToastRef.current === nextStatus) return

    shownToastRef.current = nextStatus
    if (nextStatus === "success") {
      toast.success(message)
    } else if (nextStatus === "pending") {
      toast.loading(message)
    } else {
      toast.error(message)
    }
  }, [])

  const updateStatus = useCallback(
    (nextStatus: CheckStatus) => {
      setStatus(nextStatus)
      showToast(nextStatus)
    },
    [showToast]
  )

  const handleCheck = useCallback(async () => {
    if (!isUserLoaded || !isOrganizationLoaded) return

    shownToastRef.current = null
    setStatus("loading")

    if (!merchantOrderId) {
      updateStatus("missing")
      return
    }

    if (!user?.id) {
      updateStatus("auth")
      return
    }

    try {
      const order = await checkOrder(merchantOrderId)

      if (!order) {
        updateStatus("not-found")
        return
      }

      const isOwnOrder = ownerIds.includes(order.userid)
      if (!isOwnOrder) {
        updateStatus("foreign")
        return
      }

      updateStatus(getOrderStatus(order.status))
    } catch {
      updateStatus("error")
    }
  }, [
    isOrganizationLoaded,
    isUserLoaded,
    merchantOrderId,
    ownerIds,
    updateStatus,
    user?.id,
  ])

  useEffect(() => {
    handleCheck()
  }, [handleCheck])

  return (
    <main className="relative z-10 min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-2xl rounded-3xl border border-white/40 bg-white/70 dark:border-white/10 dark:bg-zinc-950/70 p-8 shadow-lg">
        <div className="flex items-center gap-3 mb-4">
          <h1 className="text-3xl font-extrabold">
            <span className="bg-gradient-to-r from-logo-yellow to-logo-light-yellow bg-clip-text text-transparent">Notter</span>
            <span className="text-logo-cyan"> Gem</span>
          </h1>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-sm text-muted-foreground">Номер заказа</div>
              <div className="font-medium">#{merchantOrderId ?? "-"}</div>
            </div>
            <div className={`px-3 py-1 rounded-full ${statusClassName[status]}`}>
              {statusLabel[status]}
            </div>
          </div>

          <p className="text-muted-foreground">{statusMessage[status]}</p>

          <div className="flex flex-wrap gap-3">
            <Link href={pages.DASHBOARD()}>
              <Button variant="outline">На главную</Button>
            </Link>
            {(status === "cancel" || status === "failed") && (
              <Link href={pages.BUY}>
                <Button variant="outline">Выбрать тариф</Button>
              </Link>
            )}
            {canRetry && <Button onClick={handleCheck}>Повторить проверку</Button>}
          </div>
        </div>
      </div>
    </main>
  )
}
