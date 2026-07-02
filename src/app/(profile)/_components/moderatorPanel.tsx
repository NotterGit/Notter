import { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Menu } from "lucide-react";
import { changeVerifiedOrgs, checkModerator, updateUserBadge } from "../../api/users/user";
import { updateUser } from "../../api/users/user";
import { updateOrgBadge } from "../../api/orgs/org";
import { updateOrg } from "../../api/orgs/org";
import { toast } from "react-hot-toast";
import { Switch } from "@/components/ui/switch";
import { useUser } from "@clerk/clerk-react";
import type { UserProps } from "@/config/types/profile.types";
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
  const [pendingToggle, setPendingToggle] = useState<string | null>(null);
  const { user: clerkUser } = useUser();
  const isOrg = user?._id.startsWith("org_");
  const [isModerator, setIsModerator] = useState(false);

  useEffect(() => {
    const fetchModeratorStatus = async () => {
      if (!clerkUser?.id) return;
      const status = await checkModerator(clerkUser.id);
      setIsModerator(status);
    };

    fetchModeratorStatus();
  }, [clerkUser?.id]);

  if (!isModerator) {
    return null;
  }

  const { documents: documentLimit, publicDocuments: publicDocumentLimit } = getPlanLimits(user?.premium, isOrg);

  const confirmToggle = () => {
    if (typeof window === "undefined") return false;
    return window.confirm("Точно изменить это значение?");
  };

  const renderToggleControl = (
    toggleName: string,
    checked: boolean,
    onCheckedChange: () => void,
  ) => {
    if (pendingToggle === toggleName) {
      return <Loader2 className="h-4 w-4 animate-spin" />;
    }

    return <Switch checked={checked} onCheckedChange={onCheckedChange} />;
  };

  const handleBadgeToggle = async (badgeName: string) => {
    if (!user || !confirmToggle()) return;

    const currentStatus = badgeName === "verified" ? verifiedStatus : contributorStatus;
    const newStatus = !currentStatus;

    try {
      setPendingToggle(`badge:${badgeName}`);

      const result = isOrg
        ? await updateOrgBadge(user._id, badgeName, newStatus)
        : await updateUserBadge(user._id, badgeName, newStatus);

      if (result) {
        toast.success(`Бейдж '${badgeName}' обновлен на ${newStatus ? "активен" : "неактивен"}`);

        if (badgeName === "verified") {
          setVerifiedStatus(newStatus);
          if (isOrg) {
            await changeVerifiedOrgs(user.owner, newStatus ? 1 : -1);
          }

        } else if (badgeName === "contributor") {
          setContributorStatus(newStatus);
        }
      }
    } catch (error) {
      toast.error("Произошла ошибка при обновлении бейджа");
    } finally {
      setPendingToggle(null);
    }
  };

  const handleSubscriptionToggle = async (subscriptionType: "Amber" | "Diamond") => {
    if (!user || !confirmToggle()) return;

    const newPremium = subscriptionType === "Amber" ? 1 : subscriptionType === "Diamond" ? 2 : 0;

    try {
      setPendingToggle(`subscription:${subscriptionType}`);

      if ((newPremium === 1 && amberSubscription) || (newPremium === 2 && diamondSubscription)) {
        const result = isOrg
          ? await updateOrg(user._id, null, null, null, null, null, null, null, null, null, null, 0)
          : await updateUser(user._id, null, null, null, null, null, null, null, null, null, null, null, 0);
        if (result) {
          toast.success("Подписка снята");
          setAmberSubscription(false);
          setDiamondSubscription(false);
        }
      } else {
        const result = isOrg
          ? await updateOrg(user._id, null, null, null, null, null, null, null, null, null, null, newPremium)
          : await updateUser(user._id, null, null, null, null, null, null, null, null, null, null, null, newPremium);
        if (result) {
          toast.success(`Подписка ${subscriptionType} активирована`);
          if (subscriptionType === "Amber") {
            setAmberSubscription(true);
            setDiamondSubscription(false);
          } else {
            setDiamondSubscription(true);
            setAmberSubscription(false);
          }
        }
      }
    } catch (error) {
      toast.error("Произошла ошибка при обновлении подписки");
    } finally {
      setPendingToggle(null);
    }
  };

  const handleWatermarkToggle = async () => {
    if (!user || !confirmToggle()) return;
    const newWatermark = !watermark;

    try {
      setPendingToggle("watermark");

      const result = isOrg
        ? await updateOrg(user._id, null, null, null, null, null, null, null, null, null, newWatermark)
        : await updateUser(user._id, null, null, null, null, null, null, null, null, null, newWatermark);
      if (result) {
        toast.success(`Watermark обновлен на ${newWatermark ? "включен" : "выключен"}`);
        setWatermark(newWatermark);
      }
    } finally {
      setPendingToggle(null);
    }
  };

  const handlePrivatedToggle = async () => {
    if (!user || !confirmToggle()) return;
    const newPrivated = !privated;

    try {
      setPendingToggle("privated");

      const result = isOrg
        ? await updateOrg(user._id, null, null, null, null, newPrivated)
        : await updateUser(user._id, null, null, null, null, newPrivated);
      if (result) {
        toast.success(`Профиль обновлен на ${newPrivated ? "приватный" : "публичный"}`);
        setPrivated(newPrivated);
      }
    } finally {
      setPendingToggle(null);
    }
  };

  const handleModeratorToggle = async () => {
    if (!user || !user?.badges.notter || isOrg || !confirmToggle()) return;

    const newModeratorStatus = !moderatorStatus;

    try {
      setPendingToggle("moderator");

      const result = await updateUser(user._id, null, null, null, null, null, null, null, null, null, null, null, null, newModeratorStatus);
      if (result) {
        toast.success(`${newModeratorStatus ? "Назначен модератором" : "Снят с поста модератора"}`);
        setModeratorStatus(newModeratorStatus);
      }
    } finally {
      setPendingToggle(null);
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
              {renderToggleControl("watermark", watermark, handleWatermarkToggle)}
            </div>
            <div className="flex items-center gap-3">
              <p>Privated: </p>
              {renderToggleControl("privated", privated, handlePrivatedToggle)}
            </div>

            {user?.badges.notter && clerkUser?.id !== user?._id && (
              <div className="flex items-center gap-3">
                <p>Moderator</p>
                {renderToggleControl("moderator", moderatorStatus, handleModeratorToggle)}
              </div>
            )}

            <div className="flex items-center gap-3">
              <p>Amber Subscription: </p>
              {renderToggleControl("subscription:Amber", amberSubscription, () => handleSubscriptionToggle("Amber"))}
            </div>
            <div className="flex items-center gap-3">
              <p>Diamond Subscription: </p>
              {renderToggleControl("subscription:Diamond", diamondSubscription, () => handleSubscriptionToggle("Diamond"))}
            </div>
            <div className="flex items-center gap-3">
              <p>Verified</p>
              {renderToggleControl("badge:verified", verifiedStatus, () => handleBadgeToggle("verified"))}
            </div>
            <div className="flex items-center gap-3">
              <p>Contributor badge</p>
              {renderToggleControl("badge:contributor", contributorStatus, () => handleBadgeToggle("contributor"))}
            </div>
          </DialogDescription>
        </DialogContent>
      </Dialog>
    </>
  );
}
