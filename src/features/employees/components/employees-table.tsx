"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  MoreHorizontal,
  Plus,
  Search,
  UserPen,
  UserX,
  UserCheck,
  ArrowLeftRight,
  Eye,
  Users,
} from "lucide-react";
import { Role, EmployeeStatus } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { RoleBadge, EmployeeStatusBadge } from "@/components/badges";
import { UserAvatar } from "@/components/user-avatar";
import { EmptyState } from "@/components/empty-state";
import { TableSkeleton } from "@/components/skeletons";
import { TablePagination } from "@/components/table-pagination";
import { useDebouncedValue } from "@/hooks/use-debounced";
import { useSession } from "@/components/shell/session-provider";
import { CREATABLE_ROLES } from "@/lib/rbac";
import { ROLE_LABELS } from "@/lib/constants";
import type { EmployeeRow } from "../types";
import { EmployeeFormDialog } from "./employee-form-dialog";
import { TransferDialog } from "./transfer-dialog";

const PAGE_SIZE = 15;

export function EmployeesTable() {
  const session = useSession();
  const router = useRouter();
  const canAdd = CREATABLE_ROLES[session.role].length > 0;

  const [q, setQ] = useState("");
  const debouncedQ = useDebouncedValue(q);
  const [role, setRole] = useState<string>("ALL");
  const [status, setStatus] = useState<string>("ALL");
  const [page, setPage] = useState(1);

  const [rows, setRows] = useState<EmployeeRow[] | null>(null);
  const [total, setTotal] = useState(0);
  const [version, setVersion] = useState(0);
  const refresh = useCallback(() => setVersion((v) => v + 1), []);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<EmployeeRow | null>(null);
  const [transferring, setTransferring] = useState<EmployeeRow | null>(null);
  const [statusTarget, setStatusTarget] = useState<EmployeeRow | null>(null);

  useEffect(() => setPage(1), [debouncedQ, role, status]);

  useEffect(() => {
    const params = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE) });
    if (debouncedQ) params.set("q", debouncedQ);
    if (role !== "ALL") params.set("role", role);
    if (status !== "ALL") params.set("status", status);

    let cancelled = false;
    setRows(null);
    fetch(`/api/employees?${params}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => {
        if (cancelled) return;
        setRows(data.employees);
        setTotal(data.total);
      })
      .catch(() => {
        if (!cancelled) {
          setRows([]);
          toast.error("Could not load employees");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [debouncedQ, role, status, page, version]);

  async function toggleStatus(emp: EmployeeRow) {
    const next: EmployeeStatus = emp.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    const res = await fetch(`/api/employees/${emp.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast.error(data.error ?? "Could not update status");
      return;
    }
    toast.success(next === "INACTIVE" ? `${emp.name} deactivated` : `${emp.name} reactivated`);
    refresh();
  }

  const isFiltered = debouncedQ !== "" || role !== "ALL" || status !== "ALL";

  return (
    <div className="space-y-4">
      {/* toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-52 flex-1 sm:max-w-xs">
          <Search className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name, email, ID…"
            className="pl-8"
          />
        </div>
        <Select value={role} onValueChange={setRole}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All roles</SelectItem>
            {Object.values(Role).map((r) => (
              <SelectItem key={r} value={r}>
                {ROLE_LABELS[r]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Any status</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="INACTIVE">Inactive</SelectItem>
          </SelectContent>
        </Select>
        {canAdd && (
          <Button
            className="ml-auto"
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus className="size-4" /> Add employee
          </Button>
        )}
      </div>

      {/* table */}
      <div className="overflow-hidden rounded-xl border bg-card">
        {rows === null ? (
          <TableSkeleton rows={8} cols={6} />
        ) : rows.length === 0 ? (
          <EmptyState
            icon={<Users />}
            title={isFiltered ? "No employees match" : "No team members yet"}
            description={
              isFiltered
                ? "Try a different search or clear the filters."
                : canAdd
                  ? "Add your first team member to get started."
                  : "Employees you can see will appear here."
            }
            action={
              canAdd && !isFiltered ? (
                <Button size="sm" onClick={() => setFormOpen(true)}>
                  <Plus className="size-4" /> Add employee
                </Button>
              ) : undefined
            }
            className="border-0"
          />
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Employee</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="hidden md:table-cell">Manager</TableHead>
                  <TableHead className="hidden text-right lg:table-cell">Team</TableHead>
                  <TableHead className="hidden text-right sm:table-cell">Prospects</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden lg:table-cell">Joined</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((emp, i) => (
                  <motion.tr
                    key={emp.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i * 0.025, 0.3), duration: 0.2 }}
                    className="cursor-pointer border-b transition-colors last:border-0 hover:bg-muted/50"
                    onClick={() => router.push(`/dashboard/employees/${emp.id}`)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <UserAvatar name={emp.name} />
                        <div className="min-w-0 leading-tight">
                          <div className="truncate text-sm font-medium">{emp.name}</div>
                          <div className="truncate text-xs text-muted-foreground">
                            {emp.employeeId} · {emp.email}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <RoleBadge role={emp.role} />
                    </TableCell>
                    <TableCell className="hidden text-sm text-muted-foreground md:table-cell">
                      {emp.manager?.name ?? "—"}
                    </TableCell>
                    <TableCell className="hidden text-right text-sm tabular-nums lg:table-cell">
                      {emp._count.reports || "—"}
                    </TableCell>
                    <TableCell className="hidden text-right text-sm tabular-nums sm:table-cell">
                      {emp._count.prospects || "—"}
                    </TableCell>
                    <TableCell>
                      <EmployeeStatusBadge status={emp.status} />
                    </TableCell>
                    <TableCell className="hidden text-sm text-muted-foreground lg:table-cell">
                      {format(new Date(emp.joiningDate), "d MMM yyyy")}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon-sm" aria-label="Actions">
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => router.push(`/dashboard/employees/${emp.id}`)}
                          >
                            <Eye className="size-4" /> View profile
                          </DropdownMenuItem>
                          {emp.id !== session.id && (
                            <>
                              <DropdownMenuItem
                                onClick={() => {
                                  setEditing(emp);
                                  setFormOpen(true);
                                }}
                              >
                                <UserPen className="size-4" /> Edit
                              </DropdownMenuItem>
                              {emp.role !== "OWNER" && (
                                <DropdownMenuItem onClick={() => setTransferring(emp)}>
                                  <ArrowLeftRight className="size-4" /> Transfer
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              {emp.status === "ACTIVE" ? (
                                <DropdownMenuItem
                                  variant="destructive"
                                  onClick={() => setStatusTarget(emp)}
                                >
                                  <UserX className="size-4" /> Deactivate
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem onClick={() => toggleStatus(emp)}>
                                  <UserCheck className="size-4" /> Reactivate
                                </DropdownMenuItem>
                              )}
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </motion.tr>
                ))}
              </TableBody>
            </Table>
            <TablePagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
          </>
        )}
      </div>

      <EmployeeFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        employee={editing}
        onSaved={refresh}
      />
      <TransferDialog
        open={!!transferring}
        onOpenChange={(o) => !o && setTransferring(null)}
        employee={transferring}
        onSaved={refresh}
      />
      <AlertDialog open={!!statusTarget} onOpenChange={(o) => !o && setStatusTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate {statusTarget?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              They will no longer be able to sign in. Their prospects and history are kept, and you
              can reactivate them anytime.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (statusTarget) toggleStatus(statusTarget);
                setStatusTarget(null);
              }}
            >
              Deactivate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
