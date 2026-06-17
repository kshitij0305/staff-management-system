"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserPen } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { EmployeeRow } from "../types";
import { EmployeeFormDialog } from "./employee-form-dialog";

/** Opens the employee edit dialog directly from the profile page (managers only). */
export function EditProfileButton({ employee }: { employee: EmployeeRow }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <UserPen className="size-4" /> Edit
      </Button>
      <EmployeeFormDialog
        open={open}
        onOpenChange={setOpen}
        employee={employee}
        onSaved={() => router.refresh()}
      />
    </>
  );
}
