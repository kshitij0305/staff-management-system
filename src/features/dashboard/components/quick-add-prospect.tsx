"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProspectFormDialog } from "@/features/prospects/components/prospect-form-dialog";

export function QuickAddProspect() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  return (
    <>
      <Button size="lg" onClick={() => setOpen(true)}>
        <Plus className="size-4" /> Add prospect
      </Button>
      <ProspectFormDialog open={open} onOpenChange={setOpen} onSaved={() => router.refresh()} />
    </>
  );
}
