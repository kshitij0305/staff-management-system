import { cn } from "@/lib/utils";
import { avatarGradient, initials } from "@/lib/constants";

export function UserAvatar({
  name,
  className,
  textClassName,
}: {
  name: string;
  className?: string;
  textClassName?: string;
}) {
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-white select-none",
        avatarGradient(name),
        "size-8",
        className
      )}
      aria-hidden
    >
      <span className={cn("text-[11px] font-semibold", textClassName)}>{initials(name)}</span>
    </span>
  );
}
