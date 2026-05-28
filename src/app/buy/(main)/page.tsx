"use client";

import { OrganizationSwitcher, useOrganization, useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createOrder } from "../../api/order/order";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import { useConvexAuth } from "convex/react";
import { getById as getOrg } from "../../api/orgs/org";
import { getById as getUser } from "../../api/users/user";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { pages } from "@/config/routing/pages.route";
import { images } from "@/config/routing/image.route";
import type { PriceCalculation } from "@/config/types/components.types";
import type { Org, User } from "@/config/types/api.types";
import BackButton from "@/components/back-button";
import { getPlanLimits } from "@/lib/plan-limits";

export default function BuyPremium() {
    const router = useRouter();
    const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
    const { organization } = useOrganization();
    const { user } = useUser();
    const { isAuthenticated } = useConvexAuth();
    const isOrg = organization?.id !== undefined;
    const id = isOrg ? organization.id : user?.id;
    const [loading, setLoading] = useState(false);
    const [profile, setProfile] = useState<User | Org | null>(null);

    const basePrices: { [key: string]: number } = {
        "1": isOrg ? 149 : 29,
        "2": isOrg ? 299 : 99,
    };

    const calculatePrice = (): PriceCalculation => {
        if (!selectedPlan || !profile) return { price: 0, oldPrice: 0 };

        let price = basePrices[selectedPlan];
        let oldPrice = 0;

        if (profile?.premium === 1 && selectedPlan === "2") {
            price -= basePrices["1"];
            oldPrice = basePrices["2"];
        }

        return { price: price > 0 ? price : 0, oldPrice };
    };

    const canPurchasePlan = () => {
        if (profile?.premium === 1 && selectedPlan === "1") {
            toast.error("Вы уже приобрели этот тариф.");
            return false;
        }
        if (profile?.premium === 2 && selectedPlan === "2") {
            toast.error("Вы уже приобрели этот тариф.");
            return false;
        }
        return true;
    };

    useEffect(() => {
        if (!isAuthenticated) {
            router.push(pages.AUTH);
        }
        
        const fetchProfile = async () => {
            if (id) {
                if (isOrg) {
                    const orgProfile = await getOrg(id);
                    setProfile(orgProfile);
                } else {
                    const userProfile = await getUser(id);
                    setProfile(userProfile);
                }
            }
        };

        fetchProfile();
    }, [id, isOrg, isAuthenticated, router]);

    const handlePayment = async () => {
        if (!selectedPlan) {
            toast.error("Пожалуйста, выберите тариф");
            return;
        }

        if (!canPurchasePlan()) {
            return;
        }

        setLoading(true);
        const { price } = calculatePrice();

        const orderResponse = id ? await createOrder(id, parseInt(selectedPlan), "pending", price) : null;
        const paymentUrl = typeof orderResponse === "string" ? orderResponse : orderResponse?.payment_url;

        if (typeof paymentUrl === "string" && paymentUrl.length > 0) {
            window.location.href = paymentUrl;
            return;
        } else {
            toast.error("Произошла ошибка при создании заказа");
        }
        setLoading(false);
    };

    const getCurrentPlan = (): string => {
        if (!profile) return "Free";
        switch (profile.premium) {
            case 1:
                return "Amber";
            case 2:
                return "Diamond";
            default:
                return "Free";
        }
    };

    return (
        <main className="relative z-10 min-h-screen flex items-center justify-center p-6">
            <div className="relative mt-10 w-full max-w-6xl">
                <BackButton className="mb-4 xl:absolute xl:-left-14 xl:top-0 xl:mb-0 lg:-left-16" />
                <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-8 rounded-3xl border border-white/40 bg-white/70 dark:border-white/10 dark:bg-zinc-950/70 p-8 shadow-lg">
                <section className="space-y-4">
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-extrabold">
                            <span className="bg-gradient-to-r from-logo-yellow to-logo-light-yellow bg-clip-text text-transparent">Notter </span>
                            <span className="text-logo-cyan"> Gem</span>
                        </h1>
                        <Image src={images.BADGE.DIAMOND} alt="Notter Gem" width={36} height={36} />
                    </div>

                    <p className="text-muted-foreground">Выберите тариф, который подходит вам. Нажмите на карточку, чтобы выбрать.</p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <PlanCard
                            id="1"
                            title="Amber"
                            price={isOrg ? 149 : 29}
                            icon={images.BADGE.AMBER}
                            isOrg={isOrg}
                            selected={selectedPlan === "1"}
                            onSelect={() => setSelectedPlan("1")}
                        />

                        <PlanCard
                            id="2"
                            title="Diamond"
                            price={isOrg ? 299 : 99}
                            icon={images.BADGE.DIAMOND}
                            isOrg={isOrg}
                            selected={selectedPlan === "2"}
                            onSelect={() => setSelectedPlan("2")}
                        />
                    </div>
                </section>

                <aside className="bg-card/60 dark:bg-zinc-900/60 backdrop-blur rounded-2xl p-6 shadow-lg">
                    <div className="mb-4">
                        <h2 className="text-xl font-semibold">Оплата</h2>
                        <p className="text-sm text-muted-foreground">Аккаунт / Организация</p>
                        <div className="mt-2">
                            <OrganizationSwitcher />
                        </div>
                    </div>

                    <div className="mb-4">
                        <div className="flex items-center justify-between">
                            <div className="text-sm text-muted-foreground">Текущий план</div>
                            <div className="font-medium">{getCurrentPlan()}</div>
                        </div>
                    </div>

                    <div className="mb-4">
                        <div className="text-sm text-muted-foreground">Выбранный тариф</div>
                        <div className="mt-2 text-lg font-semibold">{selectedPlan === "1" ? "Amber" : selectedPlan === "2" ? "Diamond" : "—"}</div>
                    </div>

                    <div className="mb-4">
                        <div className="flex items-baseline gap-1">
                            <div className="text-2xl font-bold">{calculatePrice().price}₽</div>
                            {calculatePrice().oldPrice > 0 && (
                                <div className="text-sm line-through text-primary/70">{calculatePrice().oldPrice}₽</div>
                            )}
                        </div>
                        <div className="text-xs text-muted-foreground">Единоразово</div>
                    </div>

                    <div className="mt-6">
                        <Button onClick={handlePayment} className="w-full" disabled={loading || !selectedPlan}>
                            {loading ? "Ожидание..." : "Оплатить"}
                        </Button>
                    </div>
                </aside>
                </div>
            </div>
        </main>
    );
}

function PlanCard({ id, title, price, icon, isOrg, selected, onSelect }: { id: string; title: string; price: number; icon?: string; isOrg: boolean; selected: boolean; onSelect: () => void }) {
    const limits = getPlanLimits(Number(id), isOrg);

    return (
        <div onClick={onSelect} className={`cursor-pointer p-4 rounded-xl border transition ${selected ? "border-white shadow-lg" : "border-border/50 hover:shadow-md"} bg-card/70 dark:bg-zinc-900/60`}> 
            <div className="flex items-center gap-3">
                {icon && <Image src={icon} alt={title} width={40} height={40} />}
                <div>
                    <div className="text-lg font-semibold">{title}</div>
                    <div className="text-sm text-muted-foreground">{price}₽ / навсегда</div>
                </div>
            </div>
            <ul className="mt-3 text-sm text-muted-foreground list-disc pl-5 space-y-1">
                {title === "Amber" ? (
                    <>
                        <li>Сокращенные ссылки</li>
                        <li>Значок в профиле</li>
                        <li>До {limits.documents} заметок</li>
                        <li>До {limits.publicDocuments} публичных заметок</li>
                        <li>Лимит на загрузку до {limits.uploadMb} МБ</li>
                    </>
                ) : (
                    <>
                        <li>Все преимущества Amber</li>
                        <li>Кастомные ссылки</li>
                        <li>Отключение упоминаний Notter</li>
                        <li>Ззаметки в JSON</li>
                        <li>До {limits.documents} заметок</li>
                        <li>До {limits.publicDocuments} публичных заметок</li>
                        <li>Лимит на загрузку до {limits.uploadMb} МБ</li>
                    </>
                )}
            </ul>
        </div>
    )
}
