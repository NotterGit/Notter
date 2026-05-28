import type { Metadata } from "next"

import NotFoundClient from "./not-found-client"

export const metadata: Metadata = {
  title: "Page not found",
}

export default function Error404() {
  return <NotFoundClient />
}
