import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { Toaster } from "react-hot-toast"

import "./globals.css"
import ConvexClientProvider from "@/components/providers/convex-provider"
import { ThemeProvider } from "@/components/providers/theme-provider"
import { ThemeIcons } from "@/components/theme-icons"
import { images } from "@/config/routing/image.route"

const font = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: {
    default: "Notter",
    template: "%s | Notter",
  },
  description: "A better way to organize tasks. Meet Notter.",
  manifest: images.MANIFEST,
  icons: {
    icon: [
      {
        url: images.IMAGE.DARK_ICON,
        type: "image/png",
      },
      {
        url: images.IMAGE.LIGHT_ICON,
        type: "image/png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: images.IMAGE.DARK_ICON,
        type: "image/png",
        media: "(prefers-color-scheme: dark)",
      },
    ],
    shortcut: [
      {
        url: images.IMAGE.DARK_ICON,
      },
      {
        url: images.IMAGE.LIGHT_ICON,
        media: "(prefers-color-scheme: light)",
      },
      {
        url: images.IMAGE.DARK_ICON,
        media: "(prefers-color-scheme: dark)",
      },
    ],
    apple: [images.IMAGE.DARK_ICON],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body className={font.className}>
        <ConvexClientProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
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
            <ThemeIcons />
            {children}
          </ThemeProvider>
        </ConvexClientProvider>
      </body>
    </html>
  )
}
