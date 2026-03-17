"use client";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useState, useEffect } from "react";

interface ContactDetailsSheetProps {
  contactId: Id<"contacts"> | null;
  onClose: () => void;
}

export function ContactDetailsSheet({ contactId, onClose }: ContactDetailsSheetProps) {
  const contact = useQuery(api.contacts.get, contactId ? { id: contactId } : "skip");

  const updateContact = useMutation(api.contacts.update).withOptimisticUpdate(
    (localStore, { id, ...updates }) => {
      const existing = localStore.getQuery(api.contacts.get, { id });
      if (existing) {
        localStore.setQuery(api.contacts.get, { id }, { ...existing, ...updates, isOptimistic: true } as any);
      }
      const list = localStore.getQuery(api.contacts.list);
      if (list) {
        localStore.setQuery(
          api.contacts.list,
          {},
          list.map((c) => (c._id === id ? ({ ...c, ...updates, isOptimistic: true } as any) : c))
        );
      }
    }
  );

  const removeContact = useMutation(api.contacts.remove).withOptimisticUpdate(
    (localStore, { id }) => {
      const list = localStore.getQuery(api.contacts.list);
      if (list) {
        localStore.setQuery(
          api.contacts.list,
          {},
          list.map((c) => (c._id === id ? ({ ...c, isOptimistic: true } as any) : c))
        );
      }
    }
  );

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    jobTitle: "",
    company: "",
  });

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (contact) {
      setFormData({
        firstName: contact.firstName,
        lastName: contact.lastName,
        email: contact.email || "",
        phone: contact.phone || "",
        jobTitle: contact.jobTitle || "",
        company: contact.company || "",
      });
    }
  }, [contact]);

  const handleUpdate = (field: keyof typeof formData, value: string) => {
    if (!contactId) return;
    const original = contact ? (contact[field] || "") : "";
    if (value === original) return;
    // Silent fire-and-forget save — only toast on error
    updateContact({ id: contactId, [field]: value }).catch(() => {
      toast.error(`Failed to update ${field}`);
    });
  };

  const handleDelete = () => {
    if (!contactId) return;
    setShowDeleteConfirm(true);
  };


  const confirmDelete = async () => {
    if (!contactId) return;
    setShowDeleteConfirm(false);
    try {
      onClose();
      await removeContact({ id: contactId });
      toast.success("Contact deleted");
    } catch {
      toast.error("Failed to delete contact");

    }
  };

  const fields: Array<{
    key: keyof typeof formData;
    label: string;
    half?: boolean;
  }> = [
      { key: "firstName", label: "First Name", half: true },
      { key: "lastName", label: "Last Name", half: true },
      { key: "email", label: "Email Address" },
      { key: "phone", label: "Phone Number" },
      { key: "jobTitle", label: "Job Title" },
      { key: "company", label: "Company" },
    ];

  return (
    <Sheet open={!!contactId} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="sm:max-w-md flex flex-col h-full p-6">
        <div className="pb-4 border-b bg-muted/20 -mx-6 -mt-6 px-6 pt-6">
          <SheetHeader>
            <div className="flex items-center justify-between gap-4">
              <SheetTitle className="text-xl">Contact Details</SheetTitle>
              {(contact as any)?.isOptimistic && (
                <div className="flex items-center gap-2 text-xs font-medium text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-950/30 px-2 py-0.5 rounded-full animate-pulse border border-amber-200/50 dark:border-amber-800/50">
                  <div className="size-1.5 rounded-full bg-current" />
                  Syncing...
                </div>
              )}
            </div>
            <SheetDescription>
              View and edit detailed information for this contact.
            </SheetDescription>
          </SheetHeader>
        </div>

        <div className="flex flex-col gap-10">
          {!contact ? (
            <div className="space-y-6">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4">
                {fields.filter(f => f.half).map(({ key, label }) => (
                  <div key={key} className="space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</Label>
                    <Input
                      value={formData[key]}
                      onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
                      onBlur={(e) => handleUpdate(key, e.target.value)}
                      className="h-10 focus-visible:ring-primary/30"
                    />
                  </div>
                ))}
              </div>

              {fields.filter(f => !f.half).map(({ key, label }) => (
                <div key={key} className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</Label>
                  <Input
                    value={formData[key]}
                    onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
                    onBlur={(e) => handleUpdate(key, e.target.value)}
                    className="h-10 focus-visible:ring-primary/30"
                  />
                </div>
              ))}
            </>
          )}
        </div>

        <div className="pt-4 border-t mt-10">
          <Button
            variant="destructive"
            className="w-full h-11 transition-all hover:shadow-lg hover:shadow-destructive/20"
            onClick={handleDelete}
            disabled={!contactId}
          >
            <Trash2 className="mr-2 size-4" />
            Delete Contact
          </Button>
        </div>
      </SheetContent>

      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Contact</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this contact? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Sheet>
  );
}
