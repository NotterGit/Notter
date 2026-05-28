import { apiGet, apiPost, apiPut, removeNullish } from "../client"
import { apiRoutes } from "@/config/routing/api.route"
import type {
  ApiEntityResponse,
  CheckOrderFunction,
  CreateOrderResponse,
  CreateOrderFunction,
  Order,
  OrderCallbackFunction,
  SuccessOrderFunction,
} from "@/config/types/api.types"

export const createOrder: CreateOrderFunction = (
  userid,
  premium = null,
  status = null,
  amount = null
) => {
  return apiPost<CreateOrderResponse>(
    apiRoutes.ORDER.CREATE,
    removeNullish({
      userid,
      premium,
      status,
      amount,
    })
  )
}

export const checkOrder: CheckOrderFunction = (_id) => {
  return apiGet<Order>(apiRoutes.ORDER.CHECK(_id))
}

export const successOrder: SuccessOrderFunction = (_id) => {
  return apiPut<Order>(apiRoutes.ORDER.SUCCESS(_id))
}

export const success = successOrder

export const orderCallback: OrderCallbackFunction = (payload) => {
  const searchParams = new URLSearchParams({
    MerchantOrderId: String(payload.MerchantOrderId),
    InvId: String(payload.InvId),
    Sum: String(payload.Sum),
    Currency: payload.Currency,
    SignatureValue: payload.SignatureValue,
  })

  return apiPost<ApiEntityResponse>(`${apiRoutes.ORDER.CALLBACK}?${searchParams.toString()}`)
}
