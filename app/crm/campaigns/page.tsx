"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Plus, Trash2, ArrowRight, MoreHorizontal, Archive } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
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
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuLabel,
    ContextMenuSeparator,
    ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { toast } from "sonner";
import { format } from "date-fns";

/**
 * Renders the Campaigns dashboard with a list of campaigns, a dialog to create a new campaign, and per-campaign actions.
 *
 * Fetches campaign and pipeline template data, shows loading and empty states, allows creating campaigns via a dialog, and exposes actions for archiving and deleting campaigns (delete prompts for confirmation). Each campaign card includes navigation to the campaign's pipeline and a contextual actions menu.
 *
 * @returns A React element representing the Campaigns page.
 */
export default function CampaignsPage() {
    const router = useRouter();
    const campaigns = useQuery(api.crm.campaigns.list, {});
    const templates = useQuery(api.crm.pipelineTemplates.list);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const archiveCampaign = useMutation(api.crm.campaigns.archive);
    const removeCampaign = useMutation(api.crm.campaigns.remove);

    const handleArchive = async (id: Id<"campaigns">) => {
        try {
            await archiveCampaign({ id });
            toast.success("Campaign archived");
        } catch (error: any) {
            toast.error("Failed to archive campaign: " + (error.data?.message || error.message));
        }
    };

    const handleDelete = async (id: Id<"campaigns">) => {
        if (confirm("Are you sure you want to permanently delete this campaign? This action cannot be undone and will only work if there are no opportunities.")) {
            try {
                await removeCampaign({ id });
                toast.success("Campaign deleted");
            } catch (error: any) {
                // Surface the specific backend error message
                const errorMessage = error.data?.message || error.message || "Unknown error";
                toast.error("Failed to delete campaign: " + errorMessage);
            }
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Campaigns</h1>
                    <p className="text-muted-foreground">
                        Manage your sales initiatives and pipelines.
                    </p>
                </div>
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            New Campaign
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <CampaignForm onSuccess={() => setIsCreateOpen(false)} templates={templates || []} />
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {campaigns === undefined ? (
                    <p className="text-muted-foreground">Loading campaigns...</p>
                ) : campaigns.length === 0 ? (
                    <p className="text-muted-foreground col-span-full py-8 text-center bg-muted/20 border rounded-lg border-dashed">
                        No campaigns found. Create one to start an initiative!
                    </p>
                ) : (
                    campaigns.map((campaign) => {
                        const template = templates?.find(t => t._id === campaign.templateId);
                        return (
                            <ContextMenu key={campaign._id}>
                                <ContextMenuTrigger>
                                    <Card className="flex flex-col h-full hover:border-primary/50 transition-colors cursor-pointer" onClick={() => router.push(`/crm/campaigns/${campaign._id}`)}>
                                        <CardHeader>
                                            <div className="flex justify-between items-start">
                                                <CardTitle className="text-xl line-clamp-1">{campaign.name}</CardTitle>
                                                <Badge variant={campaign.status === "active" ? "default" : "secondary"}>
                                                    {campaign.status}
                                                </Badge>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="flex-1">
                                            <div className="text-sm text-muted-foreground">
                                                <p><strong>Created:</strong> {format(campaign._creationTime, "MMM d, yyyy")}</p>
                                                {template && <p><strong>Template:</strong> {template.name}</p>}
                                            </div>
                                        </CardContent>
                                        <CardFooter className="flex justify-between items-center" onClick={(e) => e.stopPropagation()}>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                        <span className="sr-only">Open menu</span>
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="start">
                                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem onClick={() => handleArchive(campaign._id)}>
                                                        <Archive className="mr-2 h-4 w-4" />
                                                        Archive
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => handleDelete(campaign._id)}
                                                        className="text-destructive focus:text-destructive"
                                                    >
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                            <Button size="sm" onClick={() => router.push(`/crm/campaigns/${campaign._id}`)}>
                                                View Pipeline <ArrowRight className="ml-2 h-4 w-4" />
                                            </Button>
                                        </CardFooter>
                                    </Card>
                                </ContextMenuTrigger>
                                <ContextMenuContent className="w-64">
                                    <ContextMenuLabel>{campaign.name}</ContextMenuLabel>
                                    <ContextMenuSeparator />
                                    <ContextMenuItem onClick={() => router.push(`/crm/campaigns/${campaign._id}`)}>
                                        <ArrowRight className="mr-2 h-4 w-4" />
                                        View Pipeline
                                    </ContextMenuItem>
                                    <ContextMenuSeparator />
                                    <ContextMenuItem onClick={() => handleArchive(campaign._id)}>
                                        <Archive className="mr-2 h-4 w-4" />
                                        Archive Campaign
                                    </ContextMenuItem>
                                    <ContextMenuItem
                                        onClick={() => handleDelete(campaign._id)}
                                        className="text-destructive focus:text-destructive"
                                    >
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Delete Campaign
                                    </ContextMenuItem>
                                </ContextMenuContent>
                            </ContextMenu>
                        );
                    })
                )}
            </div>
        </div>
    );
}

/**
 * Renders a form for creating a campaign, including fields for name, pipeline template, status, and description.
 *
 * The form validates that a name and a template are selected, shows success and error toasts, and calls `onSuccess`
 * after a campaign is successfully created.
 *
 * @param onSuccess - Callback invoked after successful creation (typically used to close the dialog).
 * @param templates - Available pipeline templates; used to populate the template selector. If non-empty, the first template is selected by default.
 * @returns The campaign creation form element.
 */
function CampaignForm({
    onSuccess,
    templates
}: {
    onSuccess: () => void,
    templates: { _id: Id<"pipelineTemplates">, name: string }[]
}) {
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        templateId: templates?.[0]?._id || "",
        status: "active" as const,
    });

    const createCampaign = useMutation(api.crm.campaigns.create);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name.trim()) return toast.error("Campaign name is required");
        if (!formData.templateId) return toast.error("Please select a pipeline template");

        try {
            await createCampaign({
                name: formData.name.trim(),
                templateId: formData.templateId as Id<"pipelineTemplates">,
            });
            toast.success("Campaign created");
            onSuccess();
        } catch (error: any) {
            toast.error(error.message);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <DialogHeader>
                <DialogTitle>Create Campaign</DialogTitle>
                <DialogDescription>
                    Start a new sales initiative or pipeline track.
                </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                    <Label htmlFor="name">Campaign Name *</Label>
                    <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g. Q4 Outreach, Inbound Webinar Leads"
                        autoFocus
                        required
                    />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="templateId">Pipeline Template *</Label>
                    <select
                        id="templateId"
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                        value={formData.templateId}
                        onChange={(e) => setFormData({ ...formData, templateId: e.target.value })}
                        required
                    >
                        <option value="" disabled>Select a template</option>
                        {templates.map(t => (
                            <option key={t._id} value={t._id}>{t.name}</option>
                        ))}
                    </select>
                    {templates.length === 0 && (
                        <p className="text-xs text-destructive">You need to create a Pipeline Template first.</p>
                    )}
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="status">Status</Label>
                    <select
                        id="status"
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    >
                        <option value="active">Active</option>
                        <option value="paused">Paused</option>
                        <option value="archived">Archived</option>
                    </select>
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Briefly describe the goal of this campaign."
                        className="resize-none"
                        rows={3}
                    />
                </div>
            </div>

            <DialogFooter>
                <Button type="button" variant="outline" onClick={onSuccess}>Cancel</Button>
                <Button type="submit" disabled={!formData.templateId}>Create Campaign</Button>
            </DialogFooter>
        </form>
    );
}
