import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { generateLogMessage } from "@/lib/generate-log";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import type { ActivityItemProps } from "@/config/types/activity.types";
import { User } from "lucide-react";

export function ActivityItem({ data }: ActivityItemProps) {
  return (
    <li className="flex items-start gap-x-3 p-2.5 sm:p-3">
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

        <p className="text-xs tabular-nums text-muted-foreground">
          {format(new Date(data.createdAt), "d MMM yyyy 'в' HH:mm:ss", { locale: ru })}
        </p>
      </div>
    </li>
  );
}
