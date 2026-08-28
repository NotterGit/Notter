import type { Metadata } from "next"
import localFont from "next/font/local"
import { Toaster } from "react-hot-toast"

import "./globals.css"
import ConvexClientProvider from "@/components/providers/convex-provider"
import { ThemeProvider } from "@/components/providers/theme-provider"
import { ThemeIcons } from "@/components/theme-icons"
import { images } from "@/config/routing/image.route"
import { PwaProvider } from "@/components/providers/pwa-provider"

import { headers } from "next/headers"

const font = localFont({
  src: "../../public/fonts/Inter-Variable.woff2",
  display: "swap",
})

export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers()
  const host = headersList.get("host") || ""
  const isBeta = host.includes("dev.notter.su") || host.includes("localhost:3001")

  const icon = isBeta ? images.ICONS.BETA : images.ICONS.DARK

  return {
    title: {
      default: "Notter",
      template: "%s | Notter",
    },
    description: "A better way to organize tasks. Meet Notter.",
    manifest: "/manifest.webmanifest",
    icons: {
      icon: [
        {
          url: icon,
          type: "image/png",
        },
      ],
      shortcut: [
        {
          url: icon,
        },
      ],
      apple: [icon],
    },
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body className={font.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <ConvexClientProvider>
            <Toaster
              position="bottom-center"
              containerStyle={{
                zIndex: 100000,
              }}
              toastOptions={{
                style: {
                  color: "black",
                  background: "white",
                  fontSize: "13px",
                  borderRadius: "5px",
                },
                iconTheme: {
                  primary: "black",
                  secondary: "white",
                },
              }}
            />
            <PwaProvider />
            <ThemeIcons />
            {children}
          </ConvexClientProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
