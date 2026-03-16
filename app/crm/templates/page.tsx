"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { useSafeMutation } from "@/hooks/use-safe-mutation";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Plus, GripVertical, Trash2, Pencil, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { ManageTeamDialog } from "@/components/crm/manage-team-dialog";

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

export default function PipelineTemplatesPage() {
    const templates = useQuery(api.crm.pipelineTemplates.list);
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Pipeline Templates</h1>
                    <p className="text-muted-foreground">
                        Manage the stages for your different sales pipelines.
                    </p>
                </div>
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            New Template
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <TemplateForm onSuccess={() => setIsCreateOpen(false)} />
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {templates === undefined ? (
                    <p className="text-muted-foreground">Loading templates...</p>
                ) : templates.length === 0 ? (
                    <p className="text-muted-foreground col-span-full py-8 text-center bg-muted/20 border rounded-lg border-dashed">
                        No pipeline templates found. Create one to get started!
                    </p>
                ) : (
                    templates.map((template) => (
                        <TemplateCard key={template._id} template={template} />
                    ))
                )}
            </div>
        </div>
    );
}

function TemplateCard({
    template,
}: {
    template: {
        _id: Id<"pipelineTemplates">;
        name: string;
        stages: string[];
        assignedUserIds?: string[];
        followerIds?: string[];
        assignerIds?: string[];
    };
}) {
    const [isEditOpen, setIsEditOpen] = useState(false);
    const removeTemplate = useSafeMutation(api.crm.pipelineTemplates.remove);
    const toggleAssignee = useSafeMutation(api.crm.pipelineTemplates.toggleAssignee);
    const toggleFollower = useSafeMutation(api.crm.pipelineTemplates.toggleFollower);
    const toggleAssigner = useSafeMutation(api.crm.pipelineTemplates.toggleAssigner);

    const handleDelete = async () => {
        if (confirm("Are you sure you want to delete this template?")) {
            try {
                await removeTemplate({ id: template._id });
                toast.success("Template deleted");
            } catch (error: any) {
                toast.error("Failed to delete template: " + error.message);
            }
        }
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-start justify-between space-y-0">
                <div>
                    <CardTitle className="text-xl">{template.name}</CardTitle>
                    <CardDescription>{template.stages.length} stages</CardDescription>
                </div>
                <div className="flex gap-1">
                    <ManageTeamDialog
                        trigger={
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Users className="h-4 w-4" />
                            </Button>
                        }
                        entityName={template.name}
                        assignedUserIds={template.assignedUserIds || []}
                        followerIds={template.followerIds || []}
                        assignerIds={template.assignerIds || []}
                        onToggleAssignee={(userId) => toggleAssignee({ id: template._id, userId })}
                        onToggleFollower={(userId) => toggleFollower({ id: template._id, userId })}
                        onToggleAssigner={(userId) => toggleAssigner({ id: template._id, userId })}
                    />
                    <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                        <DialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Pencil className="h-4 w-4" />
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <TemplateForm
                                initialData={template}
                                onSuccess={() => setIsEditOpen(false)}
                            />
                        </DialogContent>
                    </Dialog>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={handleDelete}>
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <div className="flex flex-wrap gap-2">
                    {template.stages.map((stage, i) => (
                        <Badge key={i} variant="secondary" className="font-normal capitalize">
                            {i + 1}. {stage}
                        </Badge>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

function TemplateForm({
    initialData,
    onSuccess,
}: {
    initialData?: { _id: Id<"pipelineTemplates">; name: string; stages: string[] };
    onSuccess: () => void;
}) {
    const [name, setName] = useState(initialData?.name || "");
    const [stages, setStages] = useState<{ id: string, name: string }[]>(
        initialData?.stages?.length
            ? initialData.stages.map((s, i) => ({ id: `stage-${i}`, name: s }))
            : ["Lead", "Meeting", "Proposal", "Closed Won", "Closed Lost"].map((s, i) => ({ id: `stage-${i}`, name: s }))
    );

    const createTemplate = useSafeMutation(api.crm.pipelineTemplates.create);
    const updateTemplate = useSafeMutation(api.crm.pipelineTemplates.update);

    const handleAddStage = () => setStages([...stages, { id: `stage-${crypto.randomUUID()}`, name: "New Stage" }]);

    const handleRemoveStage = (idToRemove: string) => {
        if (stages.length <= 1) return toast.error("Must have at least one stage");
        setStages(stages.filter(s => s.id !== idToRemove));
    };

    const handleChangeStage = (id: string, val: string) => {
        setStages(stages.map(s => s.id === id ? { ...s, name: val } : s));
    };

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
        if (!name.trim()) return toast.error("Name is required");
        const cleanedStages = stages.map(s => s.name.trim()).filter(Boolean);
        if (cleanedStages.length === 0) return toast.error("At least one empty stage name is not allowed");

        try {
            if (initialData) {
                await updateTemplate({ id: initialData._id, name: name.trim(), stages: cleanedStages });
                toast.success("Template updated");
            } else {
                await createTemplate({ name: name.trim(), stages: cleanedStages });
                toast.success("Template created");
            }
            onSuccess();
        } catch (error: any) {
            toast.error(error.message);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <DialogHeader>
                <DialogTitle>{initialData ? "Edit Template" : "Create Template"}</DialogTitle>
                <DialogDescription>
                    Define the sequence of stages for this pipeline.
                </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                    <Label htmlFor="name">Pipeline Name</Label>
                    <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. B2B Sales, Outbound Leads"
                        autoFocus
                    />
                </div>

                <div className="grid gap-2">
                    <div className="flex items-center justify-between">
                        <Label>Stages (in chronological order)</Label>
                        <Button type="button" variant="outline" size="sm" onClick={handleAddStage}>
                            Add Stage
                        </Button>
                    </div>
                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
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
                                        onChange={handleChangeStage}
                                        onRemove={handleRemoveStage}
                                    />
                                ))}
                            </SortableContext>
                        </DndContext>
                    </div>
                </div>
            </div>

            <DialogFooter>
                <Button type="button" variant="outline" onClick={onSuccess}>Cancel</Button>
                <Button type="submit">{initialData ? "Save Changes" : "Create Pipeline"}</Button>
            </DialogFooter>
        </form>
    );
}

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
        <div ref={setNodeRef} style={style} className={`flex items-center gap-2 bg-background relative ${isDragging ? "opacity-50" : ""}`}>
            <div {...attributes} {...listeners} className="cursor-grab hover:text-foreground text-muted-foreground p-1">
                <GripVertical className="h-4 w-4" />
            </div>
            <Badge variant="outline" className="w-6 justify-center shrink-0">{index + 1}</Badge>
            <Input
                value={stage.name}
                onChange={(e) => onChange(stage.id, e.target.value)}
                placeholder="Stage name"
            />
            <Button
                type="button"
                variant="ghost"
                size="icon"
                className="shrink-0 text-destructive"
                onClick={() => onRemove(stage.id)}
            >
                <Trash2 className="h-4 w-4" />
            </Button>
        </div>
    );
}
