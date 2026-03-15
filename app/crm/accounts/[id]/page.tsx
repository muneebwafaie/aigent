"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useParams, useRouter } from "next/navigation";
import { Building2, Globe, Users, ArrowLeft, Mail, Phone } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { ManageTeamDialog } from "@/components/crm/manage-team-dialog";

/**
 * Render the account detail page with header, team management, contacts list, and recent activity placeholder.
 *
 * Displays loading skeletons while fetching, a not-found message if the account does not exist, and the full account view when data is available. The full view includes account metadata (industry, size, website), a Manage Team dialog wired to mutations for assignees/followers/assigners, a list of contacts with email/phone actions, and a Recent Activity placeholder. Navigation to the accounts and contacts index pages is provided by UI controls.
 *
 * @returns The JSX element for the account detail page.
 */
export default function AccountDetailPage() {
    const params = useParams();
    const router = useRouter();
    const accountId = params.id as Id<"accounts">;

    const account = useQuery(api.crm.accounts.get, { id: accountId });
    const contacts = useQuery(api.crm.contacts.listByAccount, { accountId });
    const toggleAssignee = useMutation(api.crm.accounts.toggleAssignee);
    const toggleFollower = useMutation(api.crm.accounts.toggleFollower);
    const toggleAssigner = useMutation(api.crm.accounts.toggleAssigner);

    if (account === undefined) {
        return (
            <div className="space-y-6">
                <Button variant="ghost" disabled>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Accounts
                </Button>
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-64 w-full" />
            </div>
        );
    }

    if (account === null) {
        return (
            <div className="flex flex-col items-center justify-center h-[50vh] space-y-4">
                <h2 className="text-2xl font-bold">Account Not Found</h2>
                <Button onClick={() => router.push("/crm/accounts")}>
                    Return to Accounts
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <Button variant="ghost" onClick={() => router.push("/crm/accounts")} className="mb-4">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Accounts
            </Button>

            <div className="flex flex-col md:flex-row gap-6 items-start justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight mb-2 flex items-center gap-3">
                        <Building2 className="h-8 w-8 text-muted-foreground" />
                        {account.name}
                    </h1>
                    <div className="flex flex-wrap gap-2 mt-3">
                        {account.industry && <Badge variant="secondary">{account.industry}</Badge>}
                        {account.size && <Badge variant="outline">{account.size} employees</Badge>}
                        {account.website && (
                            <Link
                                href={account.website.startsWith('http') ? account.website : `https://${account.website}`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center text-sm text-blue-500 hover:underline"
                            >
                                <Globe className="mr-1 h-3 w-3" />
                                {account.website}
                            </Link>
                        )}
                    </div>
                </div>

                <ManageTeamDialog
                    trigger={
                        <Button variant="outline" className="flex items-center gap-2">
                            <Users className="h-4 w-4" /> Manage Team
                        </Button>
                    }
                    entityName={account.name}
                    assignedUserIds={account.assignedUserIds || []}
                    followerIds={account.followerIds || []}
                    assignerIds={account.assignerIds || []}
                    onToggleAssignee={(userId) => toggleAssignee({ id: accountId, userId })}
                    onToggleFollower={(userId) => toggleFollower({ id: accountId, userId })}
                    onToggleAssigner={(userId) => toggleAssigner({ id: accountId, userId })}
                />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Users className="h-5 w-5" />
                            Contacts at {account.name}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {contacts === undefined ? (
                            <p className="text-sm text-muted-foreground">Loading contacts...</p>
                        ) : contacts.length === 0 ? (
                            <p className="text-sm text-muted-foreground bg-muted/30 p-4 rounded-md text-center">
                                No contacts found for this account.
                            </p>
                        ) : (
                            <div className="space-y-4">
                                {contacts.map((contact) => (
                                    <div key={contact._id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                                        <div>
                                            <p className="font-medium">{contact.firstName} {contact.lastName}</p>
                                            <p className="text-xs text-muted-foreground">{contact.jobTitle || "No Title"}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            {contact.email && (
                                                <a href={`mailto:${contact.email}`} className="text-muted-foreground hover:text-foreground">
                                                    <Mail className="h-4 w-4" />
                                                </a>
                                            )}
                                            {contact.phone && (
                                                <a href={`tel:${contact.phone}`} className="text-muted-foreground hover:text-foreground">
                                                    <Phone className="h-4 w-4" />
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        <Button variant="outline" className="w-full mt-4" onClick={() => router.push("/crm/contacts")}>
                            Manage Contacts
                        </Button>
                    </CardContent>
                </Card>

                {/* Placeholder for future features like related Opportunities or Activities */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground p-4 text-center border border-dashed rounded bg-muted/10">
                            Activity timeline coming soon.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
