"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Plus, Eye, Pencil, Trash2, MoreHorizontal } from "lucide-react";
import { useRouter } from "next/navigation";
import { ColumnDef } from "@tanstack/react-table";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DataTable } from "@/components/crm/data-table";
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

type Account = {
    _id: Id<"accounts">;
    _creationTime: number;
    name: string;
    industry?: string;
    website?: string;
    size?: "1-10" | "11-50" | "51-200" | "201-500" | "500+";
    billingAddress?: string;
};

/**
 * Renders the CRM Accounts management page with listing, creation, and per-account actions.
 *
 * @returns A JSX element containing the Accounts management UI: a table of accounts, an Add Account dialog with a create form, and per-row actions for viewing details and deleting accounts.
 */
export default function AccountsPage() {
    const router = useRouter();
    const accounts = useQuery(api.crm.accounts.list);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const removeAccount = useMutation(api.crm.accounts.remove);

    const handleDelete = async (id: Id<"accounts">) => {
        if (confirm("Are you sure you want to delete this account?")) {
            try {
                await removeAccount({ id });
                toast.success("Account deleted");
            } catch (error: any) {
                toast.error("Failed to delete account: " + error.message);
            }
        }
    };

    const columns: ColumnDef<Account>[] = [
        {
            accessorKey: "name",
            header: "Account Name",
            cell: ({ row }) => (
                <div className="font-medium">{row.getValue("name")}</div>
            ),
        },
        {
            accessorKey: "industry",
            header: "Industry",
        },
        {
            accessorKey: "size",
            header: "Size",
        },
        {
            accessorKey: "_creationTime",
            header: "Created At",
            cell: ({ row }) => {
                const time = row.getValue("_creationTime") as number;
                return <div>{format(new Date(time), "MMM d, yyyy")}</div>;
            },
        },
        {
            id: "actions",
            cell: ({ row }) => {
                const account = row.original;
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
                            <DropdownMenuItem onClick={() => router.push(`/crm/accounts/${account._id}`)}>
                                <Eye className="mr-2 h-4 w-4" /> View Details
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleDelete(account._id)} className="text-destructive">
                                <Trash2 className="mr-2 h-4 w-4" /> Delete Account
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
                    <h1 className="text-3xl font-bold tracking-tight">Accounts</h1>
                    <p className="text-muted-foreground">
                        Manage your organizations and company records.
                    </p>
                </div>
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Account
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <AccountForm onSuccess={() => setIsCreateOpen(false)} />
                    </DialogContent>
                </Dialog>
            </div>

            {accounts === undefined ? (
                <p className="text-muted-foreground">Loading accounts...</p>
            ) : (
                <DataTable
                    columns={columns}
                    data={accounts}
                    onRowClick={(row) => router.push(`/crm/accounts/${row._id}`)}
                />
            )}
        </div>
    );
}

/**
 * Form component for creating a CRM account.
 *
 * Renders inputs for account name, industry, company size, and website, validates the name,
 * performs the create-account mutation, shows success or error toasts, and calls `onSuccess`
 * after a successful creation or when the user cancels.
 *
 * @param onSuccess - Callback invoked after a successful account creation or when the Cancel button is clicked (commonly used to close the surrounding dialog)
 * @returns The form element used to create a new account
 */
function AccountForm({ onSuccess }: { onSuccess: () => void }) {
    const [formData, setFormData] = useState({
        name: "",
        industry: "",
        website: "",
        size: "1-10" as const,
    });

    const createAccount = useMutation(api.crm.accounts.create);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name.trim()) return toast.error("Account name is required");

        try {
            await createAccount({
                name: formData.name.trim(),
                industry: formData.industry.trim() || undefined,
                website: formData.website.trim() || undefined,
                size: formData.size as "1-10" | "11-50" | "51-200" | "201-500" | "500+",
            });
            toast.success("Account created");
            onSuccess();
        } catch (error: any) {
            toast.error(error.message);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <DialogHeader>
                <DialogTitle>Create Account</DialogTitle>
                <DialogDescription>
                    Add a new company or organization to your CRM.
                </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                    <Label htmlFor="name">Account Name *</Label>
                    <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Acme Corp"
                        autoFocus
                        required
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="industry">Industry</Label>
                        <Input
                            id="industry"
                            value={formData.industry}
                            onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                            placeholder="Technology"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="size">Company Size</Label>
                        <select
                            id="size"
                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                            value={formData.size}
                            onChange={(e) => setFormData({ ...formData, size: e.target.value as any })}
                        >
                            <option value="1-10">1-10 employees</option>
                            <option value="11-50">11-50 employees</option>
                            <option value="51-200">51-200 employees</option>
                            <option value="201-500">201-500 employees</option>
                            <option value="500+">500+ employees</option>
                        </select>
                    </div>
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="website">Website</Label>
                    <Input
                        id="website"
                        value={formData.website}
                        onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                        placeholder="https://acmecorp.com"
                        type="url"
                    />
                </div>
            </div>

            <DialogFooter>
                <Button type="button" variant="outline" onClick={onSuccess}>Cancel</Button>
                <Button type="submit">Create Account</Button>
            </DialogFooter>
        </form>
    );
}
