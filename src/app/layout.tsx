import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { Toaster } from "react-hot-toast"

import "./globals.css"
import ConvexClientProvider from "@/components/providers/convex-provider"
import { ThemeProvider } from "@/components/providers/theme-provider"
import { ThemeIcons } from "@/components/theme-icons"
import { images } from "@/config/routing/image.route"
import { PwaProvider } from "@/components/providers/pwa-provider"

import { headers } from "next/headers"

const font = Inter({ subsets: ["latin"] })

export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers()
  const host = headersList.get("host") || ""
  const isBeta = host.includes("dev.notter.su") || host.includes("localhost:3001")

  const iconDark = isBeta ? images.IMAGE.BETA_ICON : images.IMAGE.DARK_ICON
  const iconLight = isBeta ? images.IMAGE.BETA_ICON : images.IMAGE.LIGHT_ICON

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
          url: iconDark,
          type: "image/png",
        },
        {
          url: iconLight,
          type: "image/png",
          media: "(prefers-color-scheme: light)",
        },
        {
          url: iconDark,
          type: "image/png",
          media: "(prefers-color-scheme: dark)",
        },
      ],
      shortcut: [
        {
          url: iconDark,
        },
        {
          url: iconLight,
          media: "(prefers-color-scheme: light)",
        },
        {
          url: iconDark,
          media: "(prefers-color-scheme: dark)",
        },
      ],
      apple: [iconDark],
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
