import Image from "next/image";
import { images } from "@/config/routing/image.route";
import type { BadgesProps } from "@/config/types/profile.types";

export function Badges({profile}: BadgesProps){
    return (
        <>
            {profile?.badges.notter && (
                <div className="relative group select-none">
                    <Image
                        src={images.BADGE.NOTTER}
                        alt="Notter Icon"
                        width={27}
                        height={27}
                        className="transform transition-transform duration-200 hover:scale-110"
                    />
                    <span className="absolute -top-10 left-1/2 -translate-x-1/2 rounded-lg border border-white/20 bg-zinc-950/95 px-2 py-1 text-center text-xs whitespace-nowrap text-yellow-200 opacity-0 shadow-lg transition-opacity duration-200 group-hover:opacity-100">
                    Разработчик Notter
                    </span>
                </div>
            )}

            {profile?.verifiedDocuments > 0 && (
                <div className="relative group select-none">
                    <Image
                        src={images.BADGE.NOTE_VERIFIED}
                        alt="Note Verifed Icon"
                        width={25}
                        height={25}
                        className="transform transition-transform duration-200 hover:scale-110"
                    />
                    <span className="absolute -top-10 left-1/2 -translate-x-1/2 rounded-lg border border-white/20 bg-zinc-950/95 px-2 py-1 text-center text-xs whitespace-nowrap opacity-0 shadow-lg transition-opacity duration-200 group-hover:opacity-100">
                    Создатель верефицированных заметок
                    </span>
                </div>
            )}

            {(profile?.badges.org_verifed || profile?.verifiedOrgs > 0) && (
                <div className="relative group select-none mx-0.5">
                    <Image
                        src={images.BADGE.ORG_VERIFIED}
                        alt="Note Verifed Icon"
                        width={28}
                        height={28}
                        className="transform transition-transform duration-200 hover:scale-110"
                    />
                    <span className="absolute -top-10 left-1/2 -translate-x-1/2 rounded-lg border border-white/20 bg-zinc-950/95 px-2 py-1 text-center text-xs whitespace-nowrap opacity-0 shadow-lg transition-opacity duration-200 group-hover:opacity-100">
                        Владелец верефицированной команды
                    </span>
                </div>
            )}

            {profile?.moderator && (
                <div className="relative group select-none mx-0.5">
                    <Image
                        src={images.BADGE.MODERATOR}
                        alt="Note Verifed Icon"
                        width={24}
                        height={24}
                        className="transform transition-transform duration-200 hover:scale-110"
                    />
                    <span className="absolute -top-10 left-1/2 -translate-x-1/2 rounded-lg border border-white/20 bg-zinc-950/95 px-2 py-1 text-center text-xs whitespace-nowrap text-orange-300 opacity-0 shadow-lg transition-opacity duration-200 group-hover:opacity-100">
                    Модератор
                    </span>
                </div>
            )}

            {profile?.badges.contributor && (
                <div className="relative group select-none">
                    <Image
                        src={images.BADGE.CONTRIBUTOR}
                        alt="Note Verifed Icon"
                        width={28}
                        height={28}
                        className="transform transition-transform duration-200 hover:scale-110"
                    />
                    <span className="absolute -top-10 left-1/2 -translate-x-1/2 rounded-lg border border-white/20 bg-zinc-950/95 px-2 py-1 text-center text-xs whitespace-nowrap text-rose-400 opacity-0 shadow-lg transition-opacity duration-200 group-hover:opacity-100">
                    Внесенный вклад
                    </span>
                </div>
            )}

            {profile?.premium == 1 && (
                <div className="relative group">
                    <Image
                        src={images.BADGE.AMBER}
                        alt="Note Verifed Icon"
                        width={25}
                        height={25}
                        className="transform transition-transform duration-200 hover:scale-110"
                    />
                    <span className="absolute -top-10 left-1/2 -translate-x-1/2 rounded-lg border border-white/20 bg-zinc-950/95 px-2 py-1 text-center text-xs whitespace-nowrap opacity-0 shadow-lg transition-opacity duration-200 group-hover:opacity-100">
                    Notter Gem: <span className="text-amber-300">Amber</span>
                    </span>
                </div>
            )}

            {profile?.premium == 2 && (
                <div className="relative group select-none">
                    <Image
                        src={images.BADGE.DIAMOND}
                        alt="Note Verifed Icon"
                        width={25}
                        height={25}
                        className="transform transition-transform duration-200 hover:scale-110"
                    />
                    <span className="absolute -top-10 left-1/2 -translate-x-1/2 rounded-lg border border-white/20 bg-zinc-950/95 px-2 py-1 text-center text-xs whitespace-nowrap opacity-0 shadow-lg transition-opacity duration-200 group-hover:opacity-100">
                        Notter Gem: <span className="text-cyan-300">Diamond</span>
                    </span>
                </div>
            )}

            <div className="relative group">
                <Image
                    src={images.BADGE.ID}
                    alt="ID Icon"
                    width={25}
                    height={25}
                    className="transform transition-transform duration-200 hover:scale-110"
                />
                <span className="absolute -top-14 left-1/2 -translate-x-1/2 rounded-lg border border-white/20 bg-zinc-950/95 px-2 py-1 text-center text-xs whitespace-nowrap opacity-0 shadow-lg transition-opacity duration-200 group-hover:opacity-100">
                    Дата регистрации:
                    <p>{profile?.created ? new Date(profile.created).toLocaleDateString() : "undefined"}</p>
                </span>
            </div>
        </>
    )
}
