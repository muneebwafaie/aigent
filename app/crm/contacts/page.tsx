"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Plus, Eye, Trash2, MoreHorizontal, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { ColumnDef } from "@tanstack/react-table";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DataTable } from "@/components/crm/data-table";
import { ManageTeamDialog } from "@/components/crm/manage-team-dialog";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { format } from "date-fns";

type Contact = {
    _id: Id<"contacts">;
    _creationTime: number;
    accountId?: Id<"accounts">;
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    title?: string;
    assignedUserIds?: string[];
    followerIds?: string[];
    assignerIds?: string[];
};

export default function ContactsPage() {
    const router = useRouter();
    const contacts = useQuery(api.crm.contacts.list);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [manageTeamContact, setManageTeamContact] = useState<Contact | null>(null);
    const removeContact = useMutation(api.crm.contacts.remove);
    const toggleAssignee = useMutation(api.crm.contacts.toggleAssignee);
    const toggleFollower = useMutation(api.crm.contacts.toggleFollower);
    const toggleAssigner = useMutation(api.crm.contacts.toggleAssigner);

    const handleDelete = async (id: Id<"contacts">) => {
        if (confirm("Are you sure you want to delete this contact?")) {
            try {
                await removeContact({ id });
                toast.success("Contact deleted");
            } catch (error: any) {
                toast.error("Failed to delete contact: " + error.message);
            }
        }
    };

    const columns: ColumnDef<Contact>[] = [
        {
            accessorKey: "firstName",
            header: "Name",
            cell: ({ row }) => {
                const c = row.original;
                return <div className="font-medium">{c.firstName} {c.lastName}</div>;
            },
        },
        {
            accessorKey: "title",
            header: "Title",
        },
        {
            accessorKey: "email",
            header: "Email",
            cell: ({ row }) => (
                <a href={`mailto:${row.getValue("email")}`} onClick={e => e.stopPropagation()} className="text-blue-500 hover:underline">
                    {row.getValue("email")}
                </a>
            )
        },
        {
            accessorKey: "phone",
            header: "Phone",
        },
        {
            accessorKey: "_creationTime",
            header: "Created",
            cell: ({ row }) => {
                const time = row.getValue("_creationTime") as number;
                return <div>{format(new Date(time), "MMM d, yyyy")}</div>;
            },
        },
        {
            id: "actions",
            cell: ({ row }) => {
                const contact = row.original;
                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0" onClick={(e) => e.stopPropagation()}>
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => setManageTeamContact(contact)}>
                                <Users className="mr-2 h-4 w-4" /> Manage Team
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDelete(contact._id)} className="text-destructive">
                                <Trash2 className="mr-2 h-4 w-4" /> Delete Contact
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                );
            },
        },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Contacts</h1>
                    <p className="text-muted-foreground">
                        Manage the people you do business with.
                    </p>
                </div>
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Contact
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <ContactForm onSuccess={() => setIsCreateOpen(false)} />
                    </DialogContent>
                </Dialog>
            </div>

            {contacts === undefined ? (
                <p className="text-muted-foreground">Loading contacts...</p>
            ) : (
                <DataTable
                    columns={columns}
                    data={contacts}
                />
            )}

            {manageTeamContact && (
                <ManageTeamDialog
                    open={!!manageTeamContact}
                    onOpenChange={(open) => !open && setManageTeamContact(null)}
                    entityName={`${manageTeamContact.firstName} ${manageTeamContact.lastName}`}
                    assignedUserIds={manageTeamContact.assignedUserIds || []}
                    followerIds={manageTeamContact.followerIds || []}
                    assignerIds={manageTeamContact.assignerIds || []}
                    onToggleAssignee={(userId) => toggleAssignee({ id: manageTeamContact._id, userId })}
                    onToggleFollower={(userId) => toggleFollower({ id: manageTeamContact._id, userId })}
                    onToggleAssigner={(userId) => toggleAssigner({ id: manageTeamContact._id, userId })}
                />
            )}
        </div>
    );
}

function ContactForm({ onSuccess }: { onSuccess: () => void }) {
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        title: "",
        accountId: "none"
    });

    const createContact = useMutation(api.crm.contacts.create);
    const accounts = useQuery(api.crm.accounts.list);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.firstName.trim() || !formData.lastName.trim()) {
            return toast.error("First and last name are required");
        }

        try {
            await createContact({
                firstName: formData.firstName.trim(),
                lastName: formData.lastName.trim(),
                email: formData.email.trim() || undefined,
                phone: formData.phone.trim() || undefined,
                accountId: formData.accountId === "none" ? undefined : formData.accountId as Id<"accounts">,
            });
            toast.success("Contact created");
            onSuccess();
        } catch (error: any) {
            toast.error(error.message);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <DialogHeader>
                <DialogTitle>Create Contact</DialogTitle>
                <DialogDescription>
                    Add a new person to your CRM database.
                </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="firstName">First Name *</Label>
                        <Input
                            id="firstName"
                            value={formData.firstName}
                            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                            autoFocus
                            required
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="lastName">Last Name *</Label>
                        <Input
                            id="lastName"
                            value={formData.lastName}
                            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                            required
                        />
                    </div>
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="accountId">Related Account</Label>
                    <select
                        id="accountId"
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                        value={formData.accountId}
                        onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
                    >
                        <option value="none">-- No Account --</option>
                        {accounts?.map(acc => (
                            <option key={acc._id} value={acc._id}>{acc.name}</option>
                        ))}
                    </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            placeholder="jane@example.com"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="phone">Phone</Label>
                        <Input
                            id="phone"
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            placeholder="+1 (555) 000-0000"
                        />
                    </div>
                </div>
            </div>

            <DialogFooter>
                <Button type="button" variant="outline" onClick={onSuccess}>Cancel</Button>
                <Button type="submit">Create Contact</Button>
            </DialogFooter>
        </form>
    );
}
