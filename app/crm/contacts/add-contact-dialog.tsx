"use client";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/convex/_generated/api";
import { useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { useSafeMutation } from "@/hooks/use-safe-mutation";
import { Id } from "@/convex/_generated/dataModel";

export function AddContactDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const createContact = useSafeMutation(api.contacts.create).withOptimisticUpdate(
    (localStore, args) => {
      const list = localStore.getQuery(api.contacts.list);
      if (list) {
        const optimisticId = `optimistic_${crypto.randomUUID()}` as Id<"contacts">;
        localStore.setQuery(api.contacts.list, {}, [
          ...list,
          ({
            ...args,
            _id: optimisticId,
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName || !formData.lastName) {
      toast.error("First and last names are required");
      return;
    }

    const data = { ...formData };
    // Optimistic feel: reset form and clear intent
    setFormData({ firstName: "", lastName: "", email: "", jobTitle: "" });

    try {
      setIsOpen(false);
      await createContact(data);
      toast.success("Contact added");
    } catch (e) {
      // Rollback form state on error so user can retry
      setIsOpen(true);
      setFormData(data);
      toast.error("Failed to add contact");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => setIsOpen(open)}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 size-4" />
          Add Contact
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add Contact</DialogTitle>
            <DialogDescription>
              Create a new contact in your CRM.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  placeholder="John"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  placeholder="Doe"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="john@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="jobTitle">Job Title</Label>
              <Input
                id="jobTitle"
                value={formData.jobTitle}
                onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                placeholder="Software Engineer"
              />
            </div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit">
              Save Contact
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

