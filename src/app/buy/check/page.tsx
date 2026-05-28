import { Suspense } from "react"
import { CheckBuyClient } from "./check-buy-client"

export default function CheckBuy() {
  return (
    <Suspense fallback={null}>
      <CheckBuyClient />
    </Suspense>
  )
}
