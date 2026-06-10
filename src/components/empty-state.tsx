"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

/** Generic empty-state with a soft illustrated backdrop. */
export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-dashed px-6 py-14 text-center",
        className
      )}
    >
      {icon && (
        <div className="relative mb-4">
          <div className="absolute inset-0 -m-3 rounded-full bg-primary/10 blur-xl" />
          <div className="relative flex size-12 items-center justify-center rounded-xl border bg-card text-muted-foreground shadow-sm [&_svg]:size-5">
            {icon}
          </div>
        </div>
      )}
      <h3 className="text-sm font-semibold">{title}</h3>
      {description && (
        <p className="mt-1 max-w-xs text-xs leading-relaxed text-muted-foreground">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </motion.div>
  );
}
