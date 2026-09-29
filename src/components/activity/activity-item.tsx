import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { generateLogMessage } from "@/lib/generate-log";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import type { ActivityItemProps } from "@/config/types/activity.types";
import { Plus, FileText, User } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  ACTION_BADGE_CONFIG,
  NOTE_ENTITY_BADGE_CONFIG,
} from "@/config/const/activity.const";

export const ActivityItem = ({
  data,
  extended = false,
}: ActivityItemProps) => {
  const actionConfig = ACTION_BADGE_CONFIG[data.action];
  const entityConfig = NOTE_ENTITY_BADGE_CONFIG[data.entityType];
  const ActionIcon = actionConfig?.icon || Plus;
  const EntityIcon = entityConfig?.icon || FileText;

  return (
    <li className="flex items-start gap-x-3 p-2.5 sm:p-3 rounded-xl border border-border/30 hover:border-border/60 hover:bg-muted/30 transition-colors">
      <Avatar className="h-8 w-8 mt-0.5 shrink-0">
        <AvatarImage src={data.userImage || undefined} />
        <AvatarFallback>
          <User className="h-4 w-4 text-muted-foreground" />
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex flex-wrap items-center gap-1.5 text-sm">
          <span className="font-semibold text-neutral-800 dark:text-neutral-100">
            {data.userName || "Пользователь"}
          </span>
          <span className="text-muted-foreground">{generateLogMessage(data)}</span>
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-0.5">
          <p className="text-xs text-muted-foreground">
            {format(new Date(data.createdAt), "d MMM yyyy 'в' HH:mm:ss", { locale: ru })}
          </p>

          {extended && (
            <div className="flex items-center gap-1.5 ml-auto sm:ml-0">
              {entityConfig && (
                <span
                  className={cn(
                    "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium border",
                    entityConfig.className
                  )}
                >
                  <EntityIcon className="h-3 w-3" />
                  <span>{entityConfig.label}</span>
                </span>
              )}
              {actionConfig && (
                <span
                  className={cn(
                    "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium border",
                    actionConfig.className
                  )}
                >
                  <ActionIcon className="h-3 w-3" />
                  <span>{actionConfig.label}</span>
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </li>
  );
};
