import { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Loader2, Menu, Minus, Plus } from "lucide-react";
import { checkModerator, updateUser } from "@/api/user";
import { updateOrg } from "@/api/org";
import {
  changeUserVerifiedOrgs,
  setOrgPremium,
  setUserModerator,
  setUserPremium,
  updateOrgBadge,
  updateUserBadge,
} from "@/api/admin";
import { toast } from "react-hot-toast";
import { Switch } from "@/components/ui/switch";
import { useUser } from "@clerk/clerk-react";
import type { UserProps } from "@/config/types/profile.types";
import { getPlanLimits } from "@/lib/plan-limits";

export function ModeratorPanel({ user }: UserProps) {
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [watermark, setWatermark] = useState(user?.watermark ?? false);
  const [privated, setPrivated] = useState(user?.privated ?? false);
  const [pendingToggle, setPendingToggle] = useState<string | null>(null);
  const { user: clerkUser } = useUser();
  const isOrg = user?._id.startsWith("org_");
  const [isModerator, setIsModerator] = useState(false);

  const [premium, setPremium] = useState(user?.premium ?? 0);
  const [isUserModerator, setIsUserModerator] = useState(
    !isOrg && user ? (user as { moderator?: boolean }).moderator ?? false : false
  );
  const [sendEmail, setSendEmail] = useState(true);
  const [verified, setVerified] = useState(user?.badges?.verified ?? false);
  const [contributor, setContributor] = useState(user?.badges?.contributor ?? false);
  const [verifiedOrgs, setVerifiedOrgs] = useState(
    !isOrg && user ? (user as { verifiedOrgs?: number }).verifiedOrgs ?? 0 : 0
  );

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
    disabled = false,
  ) => {
    if (pendingToggle === toggleName) {
      return <Loader2 className="h-4 w-4 animate-spin" />;
    }

    return <Switch checked={checked} disabled={disabled} onCheckedChange={onCheckedChange} />;
  };

  const handleWatermarkToggle = async () => {
    if (!user || !confirmToggle()) return;
    const newWatermark = !watermark;

    try {
      setPendingToggle("watermark");

      const result = isOrg
        ? await updateOrg(user._id, { watermark: newWatermark })
        : await updateUser(user._id, { watermark: newWatermark });
      if (result) {
        toast.success(`Watermark обновлен на ${newWatermark ? "включен" : "выключен"}`);
        setWatermark(newWatermark);
      } else {
        toast.error("Не удалось обновить watermark");
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
        ? await updateOrg(user._id, { privated: newPrivated })
        : await updateUser(user._id, { privated: newPrivated });
      if (result) {
        toast.success(`Профиль обновлен на ${newPrivated ? "приватный" : "публичный"}`);
        setPrivated(newPrivated);
      } else {
        toast.error("Не удалось обновить приватность профиля");
      }
    } finally {
      setPendingToggle(null);
    }
  };

  const handlePremiumUpdate = async () => {
    if (!user) return;

    try {
      setPendingToggle("premium");

      const result = isOrg
        ? await setOrgPremium(user._id, premium, sendEmail)
        : await setUserPremium(user._id, premium, sendEmail);

      if (result) {
        toast.success("Уровень подписки обновлен");
      } else {
        toast.error("Не удалось обновить уровень подписки");
      }
    } finally {
      setPendingToggle(null);
    }
  };

  const isSelf = !isOrg && user?._id === clerkUser?.id;

  const handleModeratorToggle = async () => {
    if (!user || isOrg || !confirmToggle()) return;
    const newModerator = !isUserModerator;

    if (isSelf && !newModerator) {
      toast.error("Нельзя снять модератора с себя");
      return;
    }

    try {
      setPendingToggle("user-moderator");

      const result = await setUserModerator(user._id, newModerator, sendEmail);

      if (result) {
        toast.success(`Модератор ${newModerator ? "назначен" : "снят"}`);
        setIsUserModerator(newModerator);
      } else {
        toast.error("Не удалось изменить статус модератора");
      }
    } finally {
      setPendingToggle(null);
    }
  };

  const handleBadgeToggle = async (badgeName: "verified" | "contributor", current: boolean, setter: (value: boolean) => void) => {
    if (!user || !confirmToggle()) return;
    const newStatus = !current;

    try {
      setPendingToggle(`badge-${badgeName}`);

      const result = isOrg
        ? await updateOrgBadge(user._id, badgeName, newStatus, sendEmail)
        : await updateUserBadge(user._id, badgeName, newStatus, sendEmail);

      if (result) {
        toast.success(`Бейдж ${badgeName} ${newStatus ? "выдан" : "снят"}`);
        setter(newStatus);
      } else {
        toast.error("Не удалось обновить бейдж");
      }
    } finally {
      setPendingToggle(null);
    }
  };

  const handleVerifiedOrgsChange = async (delta: number) => {
    if (!user || isOrg) return;

    try {
      setPendingToggle("verified-orgs");

      const result = await changeUserVerifiedOrgs(user._id, delta, sendEmail);

      if (result) {
        setVerifiedOrgs((prev) => prev + delta);
        toast.success("Количество верифицированных организаций обновлено");
      } else {
        toast.error("Не удалось обновить количество верифицированных организаций");
      }
    } finally {
      setPendingToggle(null);
    }
  };

  return (
    <>
      <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
          <Button variant={"outline"} size={"icon"} className="h-8 w-8 rounded-lg border-border/70 bg-background/70 hover:bg-background">
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
            {!isOrg && <p>Verified orgs: {verifiedOrgs}</p>}

            <hr className="my-3 border-black/10 dark:border-white/10" />

            <div className="flex items-center gap-2 pb-2">
              <Checkbox
                id="send-email"
                checked={sendEmail}
                onCheckedChange={(checked) => setSendEmail(Boolean(checked))}
              />
              <label htmlFor="send-email" className="text-sm cursor-pointer">
                Отправлять email
              </label>
            </div>

            <div className="flex items-center gap-3">
              <p>Watermark: </p>
              {renderToggleControl("watermark", watermark, handleWatermarkToggle)}
            </div>
            <div className="flex items-center gap-3">
              <p>Privated: </p>
              {renderToggleControl("privated", privated, handlePrivatedToggle)}
            </div>

            <hr className="my-3 border-black/10 dark:border-white/10" />

            <div className="space-y-2">
              <p className="font-medium">Подписка</p>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={0}
                  max={2}
                  value={premium}
                  onChange={(event) => setPremium(Number(event.target.value))}
                  className="w-24"
                />
                <Button
                  size="sm"
                  onClick={handlePremiumUpdate}
                  disabled={pendingToggle === "premium"}
                >
                  {pendingToggle === "premium" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Обновить"
                  )}
                </Button>
              </div>
            </div>

            {!isOrg && (
              <div className="flex items-center justify-between pt-2">
                <p>Модератор {isSelf && <span className="text-muted-foreground text-xs">(нельзя снять с себя)</span>}</p>
                {renderToggleControl("user-moderator", isUserModerator, handleModeratorToggle, isSelf)}
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <p>Верификация</p>
              {renderToggleControl("badge-verified", verified, () =>
                handleBadgeToggle("verified", verified, setVerified)
              )}
            </div>

            <div className="flex items-center justify-between pt-2">
              <p>Контрибьютор</p>
              {renderToggleControl("badge-contributor", contributor, () =>
                handleBadgeToggle("contributor", contributor, setContributor)
              )}
            </div>

            {!isOrg && (
              <div className="space-y-2 pt-2">
                <p className="font-medium">Верифицированные организации</p>
                <div className="flex items-center gap-2">
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => handleVerifiedOrgsChange(-1)}
                    disabled={pendingToggle === "verified-orgs"}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <Input
                    type="number"
                    value={verifiedOrgs}
                    onChange={(event) => setVerifiedOrgs(Number(event.target.value))}
                    className="w-24"
                    readOnly
                  />
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => handleVerifiedOrgsChange(1)}
                    disabled={pendingToggle === "verified-orgs"}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </DialogDescription>
        </DialogContent>
      </Dialog>
    </>
  );
}
