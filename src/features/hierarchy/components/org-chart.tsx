"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ChevronDown, Maximize, Minus, Plus, UnfoldVertical, FoldVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { UserAvatar } from "@/components/user-avatar";
import { levelHex } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { OrgUser } from "../types";
import { buildForest, layoutForest, NODE_W, NODE_H } from "../layout";

const MIN_SCALE = 0.25;
const MAX_SCALE = 2.5;

interface Camera {
  x: number;
  y: number;
  scale: number;
}

export function OrgChart({ users, viewerId }: { users: OrgUser[]; viewerId: string }) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const cameraRef = useRef<Camera>({ x: 0, y: 0, scale: 1 });
  const [camera, setCameraState] = useState<Camera>({ x: 0, y: 0, scale: 1 });
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const dragRef = useRef<{ startX: number; startY: number; camX: number; camY: number } | null>(null);
  const [dragging, setDragging] = useState(false);

  const setCamera = useCallback((cam: Camera) => {
    cameraRef.current = cam;
    setCameraState(cam);
  }, []);

  const forest = useMemo(() => buildForest(users), [users]);
  const { nodes, edges, width, height } = useMemo(
    () => layoutForest(forest, collapsed),
    [forest, collapsed]
  );

  // Unique levels present, most senior first — for the legend.
  const legendLevels = useMemo(() => {
    const byRank = new Map<number, string>();
    for (const u of users) byRank.set(u.levelRank, u.levelName);
    return [...byRank.entries()]
      .map(([rank, name]) => ({ rank, name }))
      .sort((a, b) => b.rank - a.rank);
  }, [users]);

  const fit = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const { clientWidth, clientHeight } = el;
    const scale = Math.min(
      MAX_SCALE,
      Math.max(MIN_SCALE, Math.min((clientWidth - 80) / width, (clientHeight - 80) / height, 1))
    );
    setCamera({
      x: (clientWidth - width * scale) / 2,
      y: Math.max(24, (clientHeight - height * scale) / 2),
      scale,
    });
  }, [width, height, setCamera]);

  // Fit once on mount (and when the visible tree changes size drastically is manual via button)
  const fittedRef = useRef(false);
  useEffect(() => {
    if (!fittedRef.current) {
      fittedRef.current = true;
      fit();
    }
  }, [fit]);

  const zoomAt = useCallback(
    (clientX: number, clientY: number, factor: number) => {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const px = clientX - rect.left;
      const py = clientY - rect.top;
      const cam = cameraRef.current;
      const scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, cam.scale * factor));
      const ratio = scale / cam.scale;
      setCamera({
        x: px - (px - cam.x) * ratio,
        y: py - (py - cam.y) * ratio,
        scale,
      });
    },
    [setCamera]
  );

  // Wheel zoom (non-passive so we can preventDefault)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      zoomAt(e.clientX, e.clientY, e.deltaY < 0 ? 1.12 : 1 / 1.12);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [zoomAt]);

  function onPointerDown(e: React.PointerEvent) {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    const cam = cameraRef.current;
    dragRef.current = { startX: e.clientX, startY: e.clientY, camX: cam.x, camY: cam.y };
  }
  function onPointerMove(e: React.PointerEvent) {
    const drag = dragRef.current;
    if (!drag) return;
    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;
    if (!dragging && Math.hypot(dx, dy) > 4) setDragging(true);
    setCamera({ ...cameraRef.current, x: drag.camX + dx, y: drag.camY + dy });
  }
  function onPointerUp() {
    dragRef.current = null;
    // Delay clearing so click handlers can check whether we were dragging
    requestAnimationFrame(() => setDragging(false));
  }

  function toggleCollapse(id: string) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const allParentIds = useMemo(
    () => users.filter((u) => users.some((c) => c.managerId === u.id)).map((u) => u.id),
    [users]
  );

  return (
    <div
      ref={containerRef}
      className="relative h-[calc(100dvh-10.5rem)] overflow-hidden rounded-xl border bg-card"
    >
      {/* dotted background */}
      <div
        className="absolute inset-0 opacity-60 dark:opacity-30"
        style={{
          backgroundImage: "radial-gradient(color-mix(in oklch, var(--foreground) 14%, transparent) 1px, transparent 1px)",
          backgroundSize: "22px 22px",
          backgroundPosition: `${camera.x}px ${camera.y}px`,
        }}
      />

      {/* controls */}
      <div className="absolute top-3 right-3 z-10 flex flex-col gap-1.5">
        {(
          [
            { icon: Plus, label: "Zoom in", fn: () => zoomCenter(1.25) },
            { icon: Minus, label: "Zoom out", fn: () => zoomCenter(1 / 1.25) },
            { icon: Maximize, label: "Fit to screen", fn: fit },
            { icon: FoldVertical, label: "Collapse all", fn: () => setCollapsed(new Set(allParentIds.filter((id) => !users.find((u) => u.id === id && u.managerId === null)))) },
            { icon: UnfoldVertical, label: "Expand all", fn: () => setCollapsed(new Set()) },
          ] as const
        ).map((c) => (
          <Tooltip key={c.label} delayDuration={300}>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon-sm" className="bg-card shadow-sm" onClick={c.fn} aria-label={c.label}>
                <c.icon className="size-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">{c.label}</TooltipContent>
          </Tooltip>
        ))}
      </div>

      {/* legend — derived from the levels actually present, top first */}
      <div className="absolute bottom-3 left-3 z-10 flex flex-wrap gap-x-3 gap-y-1 rounded-lg border bg-card/90 px-3 py-2 shadow-sm backdrop-blur">
        {legendLevels.map((lvl) => (
          <span key={lvl.rank} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span className="size-2 rounded-full" style={{ background: levelHex(lvl.rank) }} />
            {lvl.name}
          </span>
        ))}
      </div>

      {/* canvas */}
      <svg
        className={cn("size-full touch-none select-none", dragging ? "cursor-grabbing" : "cursor-grab")}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        role="application"
        aria-label="Organization chart. Drag to pan, scroll to zoom."
      >
        <g transform={`translate(${camera.x}, ${camera.y}) scale(${camera.scale})`}>
          {edges.map((edge) => (
            <motion.path
              key={edge.id}
              initial={false}
              animate={{ d: edge.d }}
              transition={{ type: "spring", stiffness: 260, damping: 32 }}
              fill="none"
              stroke="color-mix(in oklch, var(--foreground) 22%, transparent)"
              strokeWidth={1.5}
            />
          ))}
          {nodes.map((node) => (
            <motion.g
              key={node.user.id}
              initial={false}
              animate={{ x: node.x, y: node.y, opacity: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 32 }}
            >
              <foreignObject width={NODE_W} height={NODE_H + 16} className="overflow-visible">
                <div
                  className={cn(
                    "group relative flex h-[72px] cursor-pointer items-center gap-2.5 rounded-xl border bg-card px-3 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md",
                    node.user.id === viewerId && "ring-2 ring-primary/50",
                    node.user.status === "INACTIVE" && "opacity-55"
                  )}
                  style={{ borderTopColor: levelHex(node.user.levelRank), borderTopWidth: 3 }}
                  onClick={() => {
                    if (!dragging) router.push(`/dashboard/employees/${node.user.id}`);
                  }}
                >
                  <UserAvatar name={node.user.name} className="size-9" />
                  <div className="min-w-0 flex-1 leading-tight">
                    <div className="truncate text-[13px] font-semibold">{node.user.name}</div>
                    <div className="truncate text-[11px] text-muted-foreground">
                      {node.user.levelName}
                      {node.user.levelRank === 1
                        ? ` · ${node.user.prospectCount} prospects`
                        : node.user.reportCount > 0
                          ? ` · team of ${node.user.reportCount}`
                          : ""}
                    </div>
                  </div>
                  <span
                    className={cn(
                      "absolute top-2 right-2 size-1.5 rounded-full",
                      node.user.status === "ACTIVE" ? "bg-emerald-500" : "bg-stone-400"
                    )}
                  />
                  {node.hasChildren && (
                    <button
                      aria-label={node.collapsed ? "Expand team" : "Collapse team"}
                      className="absolute -bottom-3 left-1/2 z-10 flex h-6 min-w-6 -translate-x-1/2 items-center justify-center gap-0.5 rounded-full border bg-background px-1 text-[10px] font-semibold text-muted-foreground shadow-sm transition-colors hover:border-primary/50 hover:text-foreground"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleCollapse(node.user.id);
                      }}
                    >
                      {node.collapsed ? (
                        <>{node.user.reportCount}</>
                      ) : (
                        <ChevronDown className="size-3" />
                      )}
                    </button>
                  )}
                </div>
              </foreignObject>
            </motion.g>
          ))}
        </g>
      </svg>
    </div>
  );

  function zoomCenter(factor: number) {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    zoomAt(rect.left + rect.width / 2, rect.top + rect.height / 2, factor);
  }
}
