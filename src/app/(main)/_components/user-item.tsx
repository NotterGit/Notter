"use client"

import { OrganizationSwitcher, useOrganization, useUser } from "@clerk/clerk-react"
import { pages } from "@/config/routing/pages.route"
import Link from "next/link"
import * as React from "react"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { ChevronRight, Check } from "lucide-react"
import Image from "next/image"
import { images } from "@/config/routing/image.route"
import { getById as getUserById } from "../../api/users/user"
import { getById as getOrgById } from "../../api/orgs/org"
import { useEffect, useState } from "react"

export function UserItem(){
    const { user } = useUser()
    const { organization } = useOrganization()
    const isOrg = organization?.id !== undefined
    const [profile, setProfile] = useState<any | null>(null)

    const stopMenuEvent = (event: React.SyntheticEvent) => {
        event.stopPropagation()
    }

    const image = (user as any)?.imageUrl || (user as any)?.profileImageUrl || (user as any)?.image || null

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                if (isOrg && organization?.id) {
                    const org = await getOrgById(organization.id)
                    setProfile(org)
                    return
                }

                if (!isOrg && user?.id) {
                    const u = await getUserById(user.id)
                    setProfile(u)
                }
            } catch (e) {
                // ignore
            }
        }

        fetchProfile()
    }, [isOrg, organization?.id, user?.id])

    return (
        <div className="mr-6">
            <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                    <button className="flex w-full items-center gap-2 rounded-xl border border-transparent p-2 transition hover:border-black/10 hover:bg-white/70 dark:hover:border-white/10 dark:hover:bg-zinc-900/70">
                        <Avatar className="h-7 w-7 ring-1 ring-border/60">
                            {image ? (
                                <AvatarImage src={image} alt={user?.username ?? user?.fullName ?? "user"} className="object-cover" />
                            ) : (
                                <AvatarFallback className="text-sm">{(user?.username || "?").charAt(0).toUpperCase()}</AvatarFallback>
                            )}
                        </Avatar>
                        <div className="flex items-center gap-1.5">
                                <span className={`text-sm font-medium truncate max-w-[8rem] ${profile?.premium === 1 ? 'bg-gradient-to-b from-[#FFEB9C] to-[#FFDB4A] bg-clip-text text-transparent' : profile?.premium === 2 ? 'bg-gradient-to-b from-[#2BD8FF] to-[#94AAF3] bg-clip-text text-transparent' : 'text-muted-foreground'}`}>{user?.username ?? user?.fullName ?? "Пользователь"}</span>

                                {profile?.premium === 1 && (
                                    <Image src={images.BADGE.AMBER} alt="Amber" width={14} height={14} className="object-contain relative right-0.5" />
                                )}

                                {profile?.premium === 2 && (
                                    <Image src={images.BADGE.DIAMOND} alt="Diamond" width={14} height={14} className="object-contain relative right-0.5" />
                                )}
                        </div>
                    </button>
                </DropdownMenuTrigger>

                <DropdownMenuContent className="ml-1 flex w-56 flex-col items-start rounded-xl border-white/60 bg-white p-3 shadow-xl dark:border-white/10 dark:bg-zinc-950" align="start">
                    <div
                        onClick={stopMenuEvent}
                        onPointerDown={stopMenuEvent}
                        onKeyDown={stopMenuEvent}
                        className="w-full"
                    >
                        <OrganizationSwitcher afterSelectOrganizationUrl={pages.DASHBOARD()}/>
                    </div>

                    <DropdownMenuSeparator/>
                    
                    <Link 
                        href={pages.PROFILE(isOrg, isOrg ? organization?.slug ?? "" : user?.username ?? "")} 
                        className="flex flex-row text-sm text-primary/70 transition hover:text-primary"
                    >
                        Перейти в профиль <ChevronRight className="w-5 h-5"/>
                    </Link>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    )
}
