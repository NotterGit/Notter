import Image from "next/image";
import { images } from "@/config/routing/image.route";
import type { BadgesProps } from "@/config/types/profile.types";

export function Badges({profile}: BadgesProps){
    const isOrg = profile._id.startsWith("org_");
    const created = profile.created ? new Date(profile.created) : null;

    return (
        <>
            {!isOrg && profile?.badges?.notter && (
                <div className="relative group select-none">
                    <Image
                        src={images.BADGES.NOTTER}
                        alt="Разработчик Notter"
                        width={27}
                        height={27}
                        className="transform transition-transform duration-200 hover:scale-110"
                    />
                    <span className="pointer-events-none absolute z-20 -top-10 left-1/2 -translate-x-1/2 rounded-lg border border-white/20 bg-zinc-950/95 px-2 py-1 text-center text-xs whitespace-nowrap text-yellow-200 opacity-0 shadow-lg transition-opacity duration-200 group-hover:opacity-100">
                    Разработчик Notter
                    </span>
                </div>
            )}

            {Boolean(profile?.verifiedDocuments && profile.verifiedDocuments > 0) && (
                <div className="relative group select-none">
                    <Image
                        src={images.BADGES.NOTE_VERIFIED}
                        alt="Создатель верифицированных заметок"
                        width={25}
                        height={25}
                        className="transform transition-transform duration-200 hover:scale-110"
                    />
                    <span className="pointer-events-none absolute z-20 text-zinc-100 -top-10 left-1/2 -translate-x-1/2 rounded-lg border border-white/20 bg-zinc-950/95 px-2 py-1 text-center text-xs whitespace-nowrap opacity-0 shadow-lg transition-opacity duration-200 group-hover:opacity-100">
                    Создатель верифицированных заметок
                    </span>
                </div>
            )}

            {!isOrg && Boolean(profile?.badges?.org_verifed || (profile?.verifiedOrgs && profile.verifiedOrgs > 0)) && (
                <div className="relative group select-none mx-0.5">
                    <Image
                        src={images.BADGES.ORG_VERIFIED}
                        alt="Владелец верифицированной команды"
                        width={28}
                        height={28}
                        className="transform transition-transform duration-200 hover:scale-110"
                    />
                    <span className="pointer-events-none absolute z-20 text-zinc-100 -top-10 left-1/2 -translate-x-1/2 rounded-lg border border-white/20 bg-zinc-950/95 px-2 py-1 text-center text-xs whitespace-nowrap opacity-0 shadow-lg transition-opacity duration-200 group-hover:opacity-100">
                        Владелец верифицированной команды
                    </span>
                </div>
            )}

            {!isOrg && profile?.moderator && (
                <div className="relative group select-none mx-0.5">
                    <Image
                        src={images.BADGES.MODERATOR}
                        alt="Модератор"
                        width={24}
                        height={24}
                        className="transform transition-transform duration-200 hover:scale-110"
                    />
                    <span className="pointer-events-none absolute z-20 -top-10 left-1/2 -translate-x-1/2 rounded-lg border border-white/20 bg-zinc-950/95 px-2 py-1 text-center text-xs whitespace-nowrap text-orange-300 opacity-0 shadow-lg transition-opacity duration-200 group-hover:opacity-100">
                    Модератор
                    </span>
                </div>
            )}

            {profile?.badges?.contributor && (
                <div className="relative group select-none">
                    <Image
                        src={images.BADGES.CONTRIBUTOR}
                        alt="Участник проекта"
                        width={28}
                        height={28}
                        className="transform transition-transform duration-200 hover:scale-110"
                    />
                    <span className="pointer-events-none absolute z-20 -top-10 left-1/2 -translate-x-1/2 rounded-lg border border-white/20 bg-zinc-950/95 px-2 py-1 text-center text-xs whitespace-nowrap text-rose-400 opacity-0 shadow-lg transition-opacity duration-200 group-hover:opacity-100">
                    Внесенный вклад
                    </span>
                </div>
            )}

            {profile?.premium == 1 && (
                <div className="relative group">
                    <Image
                        src={images.BADGES.AMBER}
                        alt="Notter Gem Amber"
                        width={25}
                        height={25}
                        className="transform transition-transform duration-200 hover:scale-110"
                    />
                    <span className="pointer-events-none absolute z-20 text-zinc-100 -top-10 left-1/2 -translate-x-1/2 rounded-lg border border-white/20 bg-zinc-950/95 px-2 py-1 text-center text-xs whitespace-nowrap opacity-0 shadow-lg transition-opacity duration-200 group-hover:opacity-100">
                    Notter Gem: <span className="text-amber-300">Amber</span>
                    </span>
                </div>
            )}

            {profile?.premium == 2 && (
                <div className="relative group select-none">
                    <Image
                        src={images.BADGES.DIAMOND}
                        alt="Notter Gem Diamond"
                        width={25}
                        height={25}
                        className="transform transition-transform duration-200 hover:scale-110"
                    />
                    <span className="pointer-events-none absolute z-20 text-zinc-100 -top-10 left-1/2 -translate-x-1/2 rounded-lg border border-white/20 bg-zinc-950/95 px-2 py-1 text-center text-xs whitespace-nowrap opacity-0 shadow-lg transition-opacity duration-200 group-hover:opacity-100">
                        Notter Gem: <span className="text-cyan-300">Diamond</span>
                    </span>
                </div>
            )}

            <div className="relative group">
                <Image
                    src={images.BADGES.ID}
                    alt="Дата регистрации"
                    width={25}
                    height={25}
                    className="transform transition-transform duration-200 hover:scale-110"
                />
                <span className="pointer-events-none absolute z-20 text-zinc-100 -top-14 right-0 rounded-lg border border-white/20 bg-zinc-950/95 px-2 py-1 text-center text-xs whitespace-nowrap opacity-0 shadow-lg transition-opacity duration-200 group-hover:opacity-100">
                    Дата регистрации:
                    <span className="block">{created && Number.isFinite(created.getTime()) ? created.toLocaleDateString("ru-RU") : "Не указана"}</span>
                </span>
            </div>
        </>
    )
}
