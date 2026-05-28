"use client";

import { ReactNode, useEffect, useState } from "react";
import { ConvexReactClient } from "convex/react";
import { ClerkProvider, useAuth } from "@clerk/nextjs"
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { dark } from "@clerk/themes";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export default function ConvexClientProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [baseTheme, setBaseTheme] = useState<undefined | typeof dark>(undefined)

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme === 'dark' || savedTheme === null) {
      setBaseTheme(dark)
    } else {
      setBaseTheme(undefined)
    }
  }, [])

  return (
    <ClerkProvider
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY!}
      appearance={{
        baseTheme,
        variables: {
          colorPrimary: "#FFCC00",
          colorBackground: "hsl(var(--card))",
          colorInputBackground: "hsl(var(--background))",
          colorInputText: "hsl(var(--foreground))",
          colorText: "hsl(var(--foreground))",
          colorTextSecondary: "hsl(var(--muted-foreground))",
          colorNeutral: "hsl(var(--muted-foreground))",
          colorDanger: "hsl(var(--destructive))",
          borderRadius: "0.75rem",
          fontFamily: "inherit",
        },
        elements: {
          rootBox: "w-full",
          cardBox: "rounded-2xl border border-white/60 bg-white/80 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-zinc-950/80",
          card: "bg-transparent shadow-none",
          headerTitle: "text-foreground",
          headerSubtitle: "text-muted-foreground",
          socialButtonsBlockButton:
            "border border-black/10 bg-background/70 text-foreground shadow-none transition hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10",
          formFieldLabel: "text-foreground",
          formFieldInput:
            "rounded-xl border border-black/10 bg-background/80 text-foreground shadow-none transition focus:border-logo-yellow focus:ring-2 focus:ring-logo-yellow/25 dark:border-white/10",
          formButtonPrimary:
            "rounded-xl bg-zinc-950 text-white shadow-sm transition hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200",
          footerActionText: "text-muted-foreground",
          footerActionLink: "font-medium text-logo-cyan hover:text-logo-cyan",
          identityPreview: "rounded-xl border border-black/10 bg-background/70 dark:border-white/10",
          userButtonPopoverCard:
            "rounded-2xl border border-white/60 bg-white/95 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-zinc-950/95",
          userButtonPopoverActionButton:
            "rounded-xl text-muted-foreground hover:bg-black/5 hover:text-foreground dark:hover:bg-white/10",
          organizationSwitcherPopoverCard:
            "rounded-2xl border border-white/60 bg-white/95 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-zinc-950/95",
          organizationSwitcherTrigger:
            "rounded-xl border border-transparent hover:border-black/10 hover:bg-white/70 dark:hover:border-white/10 dark:hover:bg-zinc-900/70",
        },
      }}
    >
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        {children}
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}
