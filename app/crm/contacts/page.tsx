"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ContactsTable } from "./contacts-table";
import { useState } from "react";
import { ContactDetailsSheet } from "./contact-details-sheet";
import { AddContactDialog } from "./add-contact-dialog";
import { Id } from "@/convex/_generated/dataModel";

export default function ContactsPage() {
  const contacts = useQuery(api.contacts.list);
  const [selectedContactId, setSelectedContactId] = useState<Id<"contacts"> | null>(null);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Contacts</h1>
          <p className="text-muted-foreground">
            Manage your relationships and keep track of your team's interactions.
          </p>
        </div>
        <AddContactDialog />
      </div>

      <div className="rounded-lg border bg-card shadow-sm">
        <ContactsTable
          contacts={contacts}
          onRowClick={(id) => setSelectedContactId(id)}
        />
      </div>

      <ContactDetailsSheet
        contactId={selectedContactId}
        onClose={() => setSelectedContactId(null)}
      />


    </div>
  );
}
