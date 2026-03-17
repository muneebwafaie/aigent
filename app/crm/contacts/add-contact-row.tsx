"use client";

import { useState } from "react";
import { api } from "@/convex/_generated/api";
import { useSafeMutation } from "@/hooks/use-safe-mutation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { TableRow, TableCell } from "@/components/ui/table";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Id } from "@/convex/_generated/dataModel";

interface AddContactRowProps {
  rowIndex: number;
}

export function AddContactRow({ rowIndex }: AddContactRowProps) {
  const createContact = useSafeMutation(api.contacts.create).withOptimisticUpdate(
    (localStore, args) => {
      const list = localStore.getQuery(api.contacts.list);
      if (list) {
        localStore.setQuery(api.contacts.list, {}, [
          ...list,
          ({
            ...args,
            _id: "optimistic_id" as Id<"contacts">,
            _creationTime: Date.now(),
            tenantId: list[0]?.tenantId || "temp",
            isOptimistic: true,
          } as any),
        ]);
      }
    }
  );
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    jobTitle: "",
  });

  const handleSubmit = () => {
    if (!formData.firstName || !formData.lastName) return;

    // Fire-and-forget: clear form immediately (optimistic feel)
    const data = { ...formData };
    setFormData({ firstName: "", lastName: "", email: "", jobTitle: "" });

    createContact(data).catch(() => {
      // Revert the form so user can retry
      setFormData(data);
      toast.error("Failed to add contact");
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSubmit();
    }
  };

  return (
    <TableRow className="bg-muted/20 hover:bg-muted/30 transition-colors">
      <TableCell className="p-0">
        <Input
          placeholder="First Name"
          value={formData.firstName}
          onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
          onKeyDown={handleKeyDown}
          data-row={rowIndex}
          data-col={0}
          className="h-10 border-0 bg-transparent shadow-none px-4 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:bg-background rounded-none"
        />
      </TableCell>
      <TableCell className="p-0">
        <Input
          placeholder="Last Name"
          value={formData.lastName}
          onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
          onKeyDown={handleKeyDown}
          data-row={rowIndex}
          data-col={1}
          className="h-10 border-0 bg-transparent shadow-none px-4 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:bg-background rounded-none"
        />
      </TableCell>
      <TableCell className="p-0">
        <Input
          placeholder="Email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          onKeyDown={handleKeyDown}
          data-row={rowIndex}
          data-col={2}
          className="h-10 border-0 bg-transparent shadow-none px-4 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:bg-background rounded-none"
        />
      </TableCell>
      <TableCell className="p-0">
        <Input
          placeholder="Job Title"
          value={formData.jobTitle}
          onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
          onKeyDown={handleKeyDown}
          data-row={rowIndex}
          data-col={3}
          className="h-10 border-0 bg-transparent shadow-none px-4 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:bg-background rounded-none"
        />
      </TableCell>
      <TableCell className="p-0 pr-2">
        <Button
          size="sm"
          variant="ghost"
          className="h-8 w-8 p-0"
          onClick={handleSubmit}
          disabled={!formData.firstName || !formData.lastName}
        >
          <Plus className="size-4" />
        </Button>
      </TableCell>
    </TableRow>
  );
}
