"use client"

import { useSearchParams } from "next/navigation"
import { checkOrder } from "../../api/order/order"
import { useCallback, useEffect, useState } from "react"
import toast from "react-hot-toast"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useOrganization, useUser } from "@clerk/nextjs"
import { pages } from "@/config/routing/pages.route"

let flag = false

export function SuccessBuyClient() {
  const searchParams = useSearchParams()
  const merchantOrderId = searchParams.get("MERCHANT_ORDER_ID")
  const [isSuccess, setIsSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const { user } = useUser()
  const { organization } = useOrganization()

  const handleSuccess = useCallback(async () => {
    if (merchantOrderId === null || !user?.id) return

    try {
      const order = await checkOrder(merchantOrderId)

      if (!order) {
        if (!flag) {
          setIsSuccess(false)
          flag = true
          toast.error("Заказ не найден")
          setIsLoading(false)
        }
        return
      }

      const isOwnOrder = order.userid === user.id || (organization && order.userid === organization.id)
      if (!isOwnOrder) {
        if (!flag) {
          setIsSuccess(false)
          flag = true
          toast.error("Этот заказ не принадлежит вам")
          setIsLoading(false)
        }
        return
      }

      if (order.status === "pending") {
        if (!flag) {
          setIsSuccess(false)
          flag = true
          toast.loading("Платеж обрабатывается, подождите...")
          setIsLoading(false)
        }
        return
      }

      if (order.status === "success") {
        if (!flag) {
          setIsSuccess(true)
          flag = true
          toast.success("Заказ успешно оплачен")
          setIsLoading(false)
        }
      } else if (!flag) {
        setIsSuccess(false)
        flag = true
        toast.error("Платеж не был успешно обработан")
        setIsLoading(false)
      }
    } catch {
      if (!flag) {
        setIsSuccess(false)
        flag = true
        toast.error("Произошла непредвиденная ошибка")
        setIsLoading(false)
      }
    }
  }, [merchantOrderId, organization, user])

  useEffect(() => {
    handleSuccess()
  }, [handleSuccess])

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
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-muted-foreground">Номер заказа</div>
              <div className="font-medium">#{merchantOrderId ?? "—"}</div>
            </div>
            <div>
              {isLoading ? (
                <div className="px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-400">Проверка</div>
              ) : isSuccess ? (
                <div className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400">Оплачен</div>
              ) : (
                <div className="px-3 py-1 rounded-full bg-rose-500/20 text-rose-400">Неуспешно</div>
              )}
            </div>
          </div>

          <p className="text-muted-foreground">
            {isLoading
              ? "Проверяем платеж и статус заказа. Это может занять несколько секунд"
              : isSuccess
                ? "Спасибо! Ваш платеж успешно обработан. Приятного пользования Notter Gem!"
                : "Платеж не был успешно обработан. Если вы считаете, что это ошибка, свяжитесь с поддержкой"}
          </p>

          <div className="flex gap-3">
            <Link href={pages.DASHBOARD()}>
              <Button variant="outline">На главную</Button>
            </Link>
            {!isLoading && !isSuccess && (
              <Button
                onClick={() => {
                  flag = false
                  handleSuccess()
                }}
              >
                Повторить проверку
              </Button>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
