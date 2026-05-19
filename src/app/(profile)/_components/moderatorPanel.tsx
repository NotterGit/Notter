import { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { changeVerifiedOrgs, getById, updateUserBadge } from "../../api/users/user";
import { updateUser } from "../../api/users/user";
import { updateOrgBadge } from "../../api/orgs/org";
import { updateOrg } from "../../api/orgs/org";
import { toast } from "react-hot-toast";
import { Switch } from "@/components/ui/switch";
import { useUser } from "@clerk/clerk-react";
import { sendMail } from "../../api/mail/mail";
import type { UserProps } from "@/config/types/profile.types";
import type { User } from "@/config/types/api.types";
import { getPlanLimits } from "@/lib/plan-limits";

export function ModeratorPanel({ user }: UserProps) {
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [watermark, setWatermark] = useState(user?.watermark ?? false);
  const [privated, setPrivated] = useState(user?.privated ?? false);
  const [amberSubscription, setAmberSubscription] = useState(user?.premium === 1);
  const [diamondSubscription, setDiamondSubscription] = useState(user?.premium === 2);
  const [verifiedStatus, setVerifiedStatus] = useState(user?.badges.verified ?? false);
  const [contributorStatus, setContributorStatus] = useState(user?.badges.contributor ?? false);
  const [moderatorStatus, setModeratorStatus] = useState(user?.moderator ?? false);
  const { user: clerkUser } = useUser()
  const isOrg = user?._id.startsWith("org_");
  const [clerkUserData, setClerkUserData] = useState<User | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!clerkUser?.id) return;
      try {
        const data = await getById(clerkUser.id);
        setClerkUserData(data);
      } catch (error) {

      }
    };

    fetchUserData();
  }, [clerkUser?.id]); 

  if (clerkUserData?.moderator !== true) {
    return null
  }

  const { documents: documentLimit, publicDocuments: publicDocumentLimit } = getPlanLimits(user?.premium, isOrg);

  const handleBadgeToggle = async (badgeName: string) => {
    if (!user) return;

    const currentStatus = badgeName === "verified" ? user?.badges.verified : user?.badges.contributor;
    const newStatus = !currentStatus;

    try {
        const result = isOrg ? 
          await updateOrgBadge(user._id, badgeName, newStatus) :
          await updateUserBadge(user._id, badgeName, newStatus);
        if (result) {
          toast.success(`Бейдж '${badgeName}' обновлен на ${newStatus ? "активен" : "неактивен"}`);
          
          if (badgeName === "verified") {
              setVerifiedStatus(newStatus);
              if (isOrg)
                await changeVerifiedOrgs(user.owner, newStatus ? 1 : -1)
              
              const message = newStatus 
                ? `${user.username}, Ваш аккаунт был верифицирован модератором.`
                : `${user.username}, Ваш аккаунт был снят с верификации модератором. Вы можете обратиться в службу поддержки заполнив форму https://feedback.qual.su`;
              
              await sendMail({
                to: user?.mail as string,
                subject: "Изменение статуса верификации",
                message: message
              });
          } else if (badgeName === "contributor") {
              setContributorStatus(newStatus);
              
              const message = newStatus 
                ? `${user.username}, Бейдж контрибьютора был выдан вашему аккаунту модератором.`
                : `${user.username}, Бейдж контрибьютора был снят с вашего аккаунта модератором. Вы можете обратиться в службу поддержки заполнив форму https://feedback.qual.su`;
              
              await sendMail({
                to: user?.mail as string,
                subject: "Изменение статуса контрибьютора",
                message: message
              });
          }
        }
    } catch (error) {
        toast.error("Произошла ошибка при обновлении бейджа");
    }
  };

  const handleSubscriptionToggle = async (subscriptionType: "Amber" | "Diamond") => {
    if (!user) return;

    const newPremium = subscriptionType === "Amber" ? 1 : subscriptionType === "Diamond" ? 2 : 0;

    if ((newPremium === 1 && amberSubscription) || (newPremium === 2 && diamondSubscription)) {
      const result = isOrg ? 
        await updateOrg(user._id, null, null, null, null, null, null, null, null, null, null, 0) :
        await updateUser(user._id, null, null, null, null, null, null, null, null, null, null, null, 0);
      if (result) {
        toast.success("Подписка снята");
        setAmberSubscription(false);
        setDiamondSubscription(false);
        
        await sendMail({
          to: user?.mail as string,
          subject: "Изменение подписки",
          message: `${user.username}, Подписка ${subscriptionType} была снята с вашего аккаунта модератором. Вы можете обратиться в службу поддержки заполнив форму https://feedback.qual.su`
        });
      }
    } else {
      const result = isOrg ? 
        await updateOrg(user._id, null, null, null, null, null, null, null, null, null, null, newPremium) :
        await updateUser(user._id, null, null, null, null, null, null, null, null, null, null, null, newPremium);
      if (result) {
        toast.success(`Подписка ${subscriptionType} активирована`);
        if (subscriptionType === "Amber") {
          setAmberSubscription(true);
          setDiamondSubscription(false);
        } else {
          setDiamondSubscription(true);
          setAmberSubscription(false);
        }
        
        const subscriptionName = subscriptionType === "Amber" ? "Gem Amber" : "Diamond";
        await sendMail({
          to: user?.mail as string,
          subject: "Изменение подписки",
          message: `${user.username}, Подписка ${subscriptionName} была ${amberSubscription || diamondSubscription ? "изменена" : "выдана"} вашему аккаунту модератором.`
        });
      }
    }
  };

  const handleWatermarkToggle = async () => {
    if (!user) return;
    const newWatermark = !watermark;

    const result = isOrg ? 
        await updateOrg(user._id, null, null, null, null, null, null, null, null, null, newWatermark) : 
        await updateUser(user._id, null, null, null, null, null, null, null, null, null, newWatermark);
    if (result) {
      toast.success(`Watermark обновлен на ${newWatermark ? "включен" : "выключен"}`);
      setWatermark(newWatermark);
    }
  };

  const handlePrivatedToggle = async () => {
    if (!user) return;
    const newPrivated = !privated;

    const result = isOrg ? 
       await updateOrg(user._id, null, null, null, null, newPrivated) : 
       await updateUser(user._id, null, null, null, null, newPrivated);
    if (result) {
      toast.success(`Профиль обновлен на ${newPrivated ? "приватный" : "публичный"}`);
      setPrivated(newPrivated);
    }
  };

  const handleModeratorToggle = async () => {
    if (!user || !user?.badges.notter || isOrg) return;

    const newModeratorStatus = !moderatorStatus;
    const result = await updateUser(user._id, null, null, null, null, null, null, null, null, null, null, null, null, newModeratorStatus);
    if (result) {
      toast.success(`${newModeratorStatus ? "Назначен модератором" : "Снят с поста модератора"}`);
      setModeratorStatus(newModeratorStatus);
    }
  };

  const handleOpenDialog = () => {
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  return (
    <>
      <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
          <Button onClick={handleOpenDialog} variant={"outline"} size={"icon"} className="h-8 w-8 rounded-lg border-border/70 bg-background/70 hover:bg-background">
            <Menu />
          </Button>
        </DialogTrigger>

        <DialogContent className="rounded-2xl border-white/40 bg-white/95 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-zinc-950/95">
          <DialogTitle className="text-lg font-semibold">Панель Модератора</DialogTitle>
          <DialogDescription>
            <p className="text-xs">_id: {user?._id}</p>
            {isOrg && <p>Owner _id: {user?.owner}</p>}
            {isOrg && <p>Members:</p>}
            {isOrg && user?.members.map((member) => (
              <p key={member}>- {member}</p>
            ))}
            {!isOrg && <p>Mail: {user?.mail}</p>}
            <p>Documents: {user?.documents}/{documentLimit}</p>
            <p>Public Documents: {user?.publicDocuments}/{publicDocumentLimit}</p>
            <p>Verified Documents: {user?.verifiedDocuments}</p>
            {!isOrg && <p>Verified orgs: {user?.verifiedOrgs}</p>}
            
            <hr className="my-3 border-black/10 dark:border-white/10" />

            <div className="flex items-center gap-3">
              <p>Watermark: </p>
              <Switch checked={watermark} onCheckedChange={handleWatermarkToggle} />
            </div>
            <div className="flex items-center gap-3">
              <p>Privated: </p>
              <Switch checked={privated} onCheckedChange={handlePrivatedToggle} />
            </div>

            {user?.badges.notter && clerkUser?.id !== user?._id && (
              <div className="flex items-center gap-3">
                <p>Moderator</p>
                <Switch checked={moderatorStatus} onCheckedChange={handleModeratorToggle} />
              </div>
            )}

            <div className="flex items-center gap-3">
              <p>Amber Subscription: </p>
              <Switch
                checked={amberSubscription}
                onCheckedChange={() => handleSubscriptionToggle("Amber")}
              />
            </div>
            <div className="flex items-center gap-3">
              <p>Diamond Subscription: </p>
              <Switch
                checked={diamondSubscription}
                onCheckedChange={() => handleSubscriptionToggle("Diamond")}
              />
            </div>
            <div className="flex items-center gap-3">
              <p>Verified</p>
              <Switch
                checked={verifiedStatus}
                onCheckedChange={() => handleBadgeToggle("verified")}
              />
            </div>
            <div className="flex items-center gap-3">
              <p>Contributor badge</p>
              <Switch
                checked={contributorStatus}
                onCheckedChange={() => handleBadgeToggle("contributor")}
              />
            </div>
          </DialogDescription>
        </DialogContent>
      </Dialog>
    </>
  );
}
