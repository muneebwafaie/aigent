"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Plus, Settings, GripVertical, Trash2, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from "@dnd-kit/core";
import {
    SortableContext,
    verticalListSortingStrategy,
    sortableKeyboardCoordinates,
    arrayMove,
    useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { KanbanBoard } from "@/components/crm/kanban-board";
import { OpportunityForm } from "@/components/crm/opportunity-form";
import { OpportunityEditSheet } from "@/components/crm/opportunity-edit-sheet";
import { ManageTeamDialog } from "@/components/crm/manage-team-dialog";
import {
    Dialog,
    DialogContent,
    DialogTrigger,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Archive } from "lucide-react";

/**
 * Page component that displays and manages a campaign's pipeline, its stages, and associated opportunities.
 *
 * Renders campaign metadata, team and stage management dialogs, actions to archive or delete the campaign,
 * a form to create new opportunities, and a Kanban board for viewing, moving, editing, and deleting opportunities.
 * Movement of opportunities updates the local UI optimistically while persisting changes via a mutation.
 *
 * @returns The JSX element for the campaign detail page.
 */
export default function CampaignDetailPage() {
    const params = useParams();
    const router = useRouter();
    const campaignId = params.id as Id<"campaigns">;

    const campaign = useQuery(api.crm.campaigns.get, { id: campaignId });
    const opportunities = useQuery(api.crm.opportunities.listByCampaign, { campaignId });
    const toggleAssignee = useMutation(api.crm.campaigns.toggleAssignee);
    const toggleFollower = useMutation(api.crm.campaigns.toggleFollower);
    const toggleAssigner = useMutation(api.crm.campaigns.toggleAssigner);

    const archiveCampaign = useMutation(api.crm.campaigns.archive);
    const removeCampaign = useMutation(api.crm.campaigns.remove);
    const moveStage = useMutation(api.crm.opportunities.moveStage).withOptimisticUpdate(
        (localStore, { id, stageIndex }) => {
            const existingOpps = localStore.getQuery(api.crm.opportunities.listByCampaign, { campaignId });
            if (existingOpps) {
                const newOpps = existingOpps.map(opp =>
                    opp._id === id ? { ...opp, stageIndex } : opp
                );
                localStore.setQuery(api.crm.opportunities.listByCampaign, { campaignId }, newOpps);
            }
        }
    );
    const removeOpp = useMutation(api.crm.opportunities.remove);

    const handleArchive = async () => {
        try {
            await archiveCampaign({ id: campaignId });
            toast.success("Campaign archived");
        } catch (error: any) {
            toast.error("Failed to archive campaign: " + (error.data?.message || error.message));
        }
    };

    const handleDelete = async () => {
        if (confirm("Are you sure you want to permanently delete this campaign? This action cannot be undone and will only work if there are no opportunities.")) {
            try {
                await removeCampaign({ id: campaignId });
                toast.success("Campaign deleted");
                router.push("/crm/campaigns");
            } catch (error: any) {
                const errorMessage = error.data?.message || error.message || "Unknown error";
                toast.error("Failed to delete campaign: " + errorMessage);
            }
        }
    };

    const [isOppFormOpen, setIsOppFormOpen] = useState(false);
    const [isManageStagesOpen, setIsManageStagesOpen] = useState(false);
    const [selectedOpp, setSelectedOpp] = useState<any | null>(null);
    const [pendingOpportunityIds, setPendingOpportunityIds] = useState<Set<Id<"opportunities">>>(new Set());

    if (campaign === undefined || opportunities === undefined) {
        return (
            <div className="space-y-6">
                <Button variant="ghost" disabled>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Campaigns
                </Button>
                <div className="flex gap-4">
                    <Skeleton className="h-[600px] w-80 rounded-xl" />
                    <Skeleton className="h-[600px] w-80 rounded-xl" />
                    <Skeleton className="h-[600px] w-80 rounded-xl" />
                </div>
            </div>
        );
    }

    if (campaign === null) {
        return (
            <div className="flex flex-col items-center justify-center h-[50vh] space-y-4">
                <h2 className="text-2xl font-bold">Campaign Not Found</h2>
                <Button onClick={() => router.push("/crm/campaigns")}>
                    Return to Campaigns
                </Button>
            </div>
        );
    }

    const stages = campaign.stages || [];

    const handleMoveOpp = async (oppId: Id<"opportunities">, newStageIndex: number) => {
        setPendingOpportunityIds(prev => new Set(prev).add(oppId));
        try {
            await moveStage({ id: oppId, stageIndex: newStageIndex });
        } catch (error: any) {
            toast.error("Failed to move opportunity: " + error.message);
        } finally {
            setPendingOpportunityIds(prev => {
                const next = new Set(prev);
                next.delete(oppId);
                return next;
            });
        }
    };

    const handleDeleteOpp = async (oppId: Id<"opportunities">) => {
        try {
            await removeOpp({ id: oppId });
            toast.success("Opportunity deleted");
        } catch (error: any) {
            console.error("Failed to delete opportunity:", error);
            toast.error(error.message || "Failed to delete opportunity");
        }
    };

    const handleEditOpp = (opp: any) => {
        // For now, just log it. In a real app, this would open a modal or sheet.
        console.log("Edit opportunity:", opp);
        toast.info(`Editing ${opp.title} (coming soon)`);
    };

    const handleOppClick = (opp: any) => {
        setSelectedOpp(opp);
    };

    return (
        <div className="flex flex-col h-[calc(100vh-80px)] space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <Button variant="ghost" onClick={() => router.push("/crm/campaigns")} className="mb-2 -ml-2">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Campaigns
                    </Button>
                    <h1 className="text-3xl font-bold tracking-tight">{campaign.name} pipeline</h1>
                    <p className="text-muted-foreground">Manage opportunities in this campaign.</p>
                </div>
                <div className="flex gap-2">
                    <ManageTeamDialog
                        trigger={
                            <Button variant="outline">
                                <Users className="mr-2 h-4 w-4" />
                                Manage Team
                            </Button>
                        }
                        entityName={campaign.name}
                        assignedUserIds={campaign.assignedUserIds || []}
                        followerIds={campaign.followerIds || []}
                        assignerIds={campaign.assignerIds || []}
                        onToggleAssignee={(userId) => toggleAssignee({ id: campaignId, userId })}
                        onToggleFollower={(userId) => toggleFollower({ id: campaignId, userId })}
                        onToggleAssigner={(userId) => toggleAssigner({ id: campaignId, userId })}
                    />
                    <Dialog open={isManageStagesOpen} onOpenChange={setIsManageStagesOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline">
                                <Settings className="mr-2 h-4 w-4" />
                                Manage Stages
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                            <CampaignStagesForm
                                campaignId={campaignId}
                                initialStages={stages}
                                onSuccess={() => setIsManageStagesOpen(false)}
                            />
                        </DialogContent>
                    </Dialog>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Campaign Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={handleArchive}>
                                <Archive className="mr-2 h-4 w-4" />
                                Archive Campaign
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={handleDelete}
                                className="text-destructive focus:text-destructive"
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Campaign
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <Dialog open={isOppFormOpen} onOpenChange={setIsOppFormOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                New Opportunity
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                            <OpportunityForm
                                campaignId={campaignId}
                                onSuccess={() => setIsOppFormOpen(false)}
                                stages={stages}
                            />
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <div className="flex-1 overflow-hidden">
                {stages.length === 0 ? (
                    <div className="flex flex-col h-full items-center justify-center p-8 text-center bg-muted/20 border border-dashed rounded-lg">
                        <h3 className="text-lg font-semibold">No Stages Configured</h3>
                        <p className="text-muted-foreground mt-2">
                            The pipeline template for this campaign has no stages.
                        </p>
                    </div>
                ) : (
                    <KanbanBoard
                        stages={stages}
                        opportunities={opportunities}
                        onMoveOpp={handleMoveOpp}
                        onOppClick={handleOppClick}
                        onDeleteOpp={handleDeleteOpp}
                        onEditOpp={handleEditOpp}
                        pendingOpportunityIds={pendingOpportunityIds}
                    />
                )}
            </div>
            <OpportunityEditSheet
                opportunity={selectedOpp}
                isOpen={!!selectedOpp}
                onClose={() => setSelectedOpp(null)}
                stages={stages}
            />
        </div>
    );
}

/**
 * Renders a form to view, reorder, add, edit, and remove stages for a campaign.
 *
 * Persists changes by calling the campaign stages update mutation and shows success or error feedback. The form enforces at least one stage and computes a mapping of original stage indices to their new indices when submitting.
 *
 * @param campaignId - The campaign record ID whose stages are being managed
 * @param initialStages - Initial list of stage names used to populate the form
 * @param onSuccess - Callback invoked after a successful update or when the user cancels the dialog
 * @returns The form UI for managing campaign stages
 */
function CampaignStagesForm({
    campaignId,
    initialStages,
    onSuccess,
}: {
    campaignId: Id<"campaigns">;
    initialStages: string[];
    onSuccess: () => void;
}) {
    const [stages, setStages] = useState<{ id: string, name: string }[]>(
        initialStages.map((s, i) => ({ id: `stage-${i}`, name: s }))
    );

    const updateStages = useMutation(api.crm.campaigns.updateStages);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: any) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            setStages((items) => {
                const oldIndex = items.findIndex(i => i.id === active.id);
                const newIndex = items.findIndex(i => i.id === over.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const cleanedStages = stages.map(s => s.name.trim()).filter(Boolean);
        if (cleanedStages.length === 0) return toast.error("At least one stage is required");

        const mapping: Record<string, number> = {};
        stages.forEach((stage, newIndex) => {
            if (stage.id.startsWith("stage-")) {
                const oldIndex = stage.id.split("-")[1];
                mapping[oldIndex] = newIndex;
            }
        });

        try {
            await updateStages({ id: campaignId, stages: cleanedStages, mapping });
            toast.success("Stages updated successfully");
            onSuccess();
        } catch (error: any) {
            toast.error(error.message);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <DialogHeader>
                <DialogTitle>Manage Stages</DialogTitle>
                <DialogDescription>
                    Reorder and edit stages for this campaign. Operations here modify the campaign directly.
                </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext
                            items={stages.map(s => s.id)}
                            strategy={verticalListSortingStrategy}
                        >
                            {stages.map((stage, index) => (
                                <SortableStageItem
                                    key={stage.id}
                                    stage={stage}
                                    index={index}
                                    onChange={(id, val) => setStages(stages.map(s => s.id === id ? { ...s, name: val } : s))}
                                    onRemove={(id) => stages.length > 1 ? setStages(stages.filter(s => s.id !== id)) : toast.error("Must have at least one stage")}
                                />
                            ))}
                        </SortableContext>
                    </DndContext>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={() => setStages([...stages, { id: `stage-new-${crypto.randomUUID()}`, name: "New Stage" }])}>
                    <Plus className="mr-2 h-4 w-4" /> Add Stage
                </Button>
            </div>

            <DialogFooter>
                <Button type="button" variant="outline" onClick={onSuccess}>Cancel</Button>
                <Button type="submit">Save Changes</Button>
            </DialogFooter>
        </form>
    );
}

/**
 * Render a draggable, editable stage row used inside the stages reorder list.
 *
 * Renders a drag handle, a 1-based index label, an input bound to the stage name, and a remove button.
 *
 * @param stage - The stage object containing `id` and `name`.
 * @param index - Zero-based position of the stage in the list (displayed as 1-based).
 * @param onChange - Called when the stage name changes: receives the stage `id` and the new name.
 * @param onRemove - Called when the remove button is pressed: receives the stage `id`.
 * @returns The JSX element representing the sortable stage item.
 */
function SortableStageItem({
    stage,
    index,
    onChange,
    onRemove
}: {
    stage: { id: string, name: string };
    index: number;
    onChange: (id: string, val: string) => void;
    onRemove: (id: string) => void;
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: stage.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 100 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} className={`flex items-center gap-2 bg-background border rounded-md p-2 ${isDragging ? "opacity-50" : ""}`}>
            <button type="button" className="cursor-grab hover:text-foreground text-muted-foreground p-1" {...attributes} {...listeners}>
                <GripVertical className="h-4 w-4" />
            </button>
            <span className="text-sm font-medium w-6 text-muted-foreground">{index + 1}.</span>
            <Input
                value={stage.name}
                onChange={(e) => onChange(stage.id, e.target.value)}
                className="flex-1 h-8"
                placeholder="Stage name"
            />
            <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => onRemove(stage.id)}
            >
                <Trash2 className="h-4 w-4" />
            </Button>
        </div>
    );
}
