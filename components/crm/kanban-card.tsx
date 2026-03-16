"use client";

import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Opportunity } from "./kanban-board";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { DollarSign, Edit, Trash2, ArrowRight } from "lucide-react";
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuTrigger,
    ContextMenuSub,
    ContextMenuSubContent,
    ContextMenuSubTrigger,
    ContextMenuSeparator,
} from "@/components/ui/context-menu";

interface KanbanCardProps {
    opportunity: Opportunity;
    stages?: string[];
    isOverlay?: boolean;
    isPending?: boolean;
    onClick?: () => void;
    onMove?: (newStageIndex: number) => void;
    onDelete?: () => void;
    onEdit?: () => void;
}

export function KanbanCard({
    opportunity,
    stages = [],
    isOverlay,
    isPending,
    onClick,
    onMove,
    onDelete,
    onEdit
}: KanbanCardProps) {
    const {
        setNodeRef,
        attributes,
        listeners,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: opportunity._id,
        data: {
            type: "Opportunity",
            opportunity,
        },
    });

    const style = {
        transition,
        transform: CSS.Transform.toString(transform),
    };

    if (isDragging) {
        return (
            <div
                ref={setNodeRef}
                style={style}
                className="h-32 w-full rounded-xl border-2 border-dashed border-primary bg-primary/10 opacity-50"
            />
        );
    }

    return (
        <ContextMenu>
            <ContextMenuTrigger asChild>
                <Card
                    ref={setNodeRef}
                    style={style}
                    className={`relative cursor-grab active:cursor-grabbing hover:bg-muted/50 transition-colors ${isOverlay ? "ring-2 ring-primary rotate-2 shadow-2xl" : ""
                        } ${isPending ? "opacity-60 grayscale-50" : ""}`}
                    {...attributes}
                    {...listeners}
                    onClick={isPending ? undefined : onClick}
                >
                    {isPending && (
                        <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/20 rounded-xl backdrop-blur-[1px]">
                            <Badge variant="outline" className="bg-background animate-pulse shadow-sm">
                                Syncing...
                            </Badge>
                        </div>
                    )}
                    <CardHeader className="p-4 pb-2">
                        <div className="flex justify-between items-start gap-2">
                            <CardTitle className="text-sm font-medium line-clamp-2">
                                {opportunity.title}
                            </CardTitle>
                            <Badge variant={opportunity.probability >= 50 ? 'default' : 'secondary'} className="text-[10px] uppercase">
                                {opportunity.probability}%
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-2 pb-2">
                        {opportunity.value !== undefined ? (
                            <div className="flex items-center text-sm font-semibold text-green-600 dark:text-green-500">
                                <DollarSign className="h-3 w-3 mr-1" />
                                {opportunity.value.toLocaleString()}
                            </div>
                        ) : (
                            <div className="text-sm text-muted-foreground italic">No value</div>
                        )}
                    </CardContent>
                    <CardFooter className="p-4 pt-0 text-xs text-muted-foreground flex justify-between">
                        <span>{format(opportunity._creationTime, "MMM d")}</span>
                        {opportunity.expectedCloseDate && (
                            <span className="text-orange-500">
                                Close: {format(new Date(opportunity.expectedCloseDate), "MMM d")}
                            </span>
                        )}
                    </CardFooter>
                </Card>
            </ContextMenuTrigger>
            <ContextMenuContent className="w-48">
                <ContextMenuItem onClick={onEdit}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Opportunity
                </ContextMenuItem>

                {stages.length > 0 && (
                    <ContextMenuSub>
                        <ContextMenuSubTrigger>
                            <ArrowRight className="mr-2 h-4 w-4" />
                            Move to Stage
                        </ContextMenuSubTrigger>
                        <ContextMenuSubContent className="w-48">
                            {stages.map((stage, index) => (
                                <ContextMenuItem
                                    key={stage}
                                    disabled={index === opportunity.stageIndex}
                                    onClick={() => onMove?.(index)}
                                >
                                    {stage}
                                </ContextMenuItem>
                            ))}
                        </ContextMenuSubContent>
                    </ContextMenuSub>
                )}

                <ContextMenuSeparator />

                <ContextMenuItem onClick={onDelete} className="text-destructive focus:text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                </ContextMenuItem>
            </ContextMenuContent>
        </ContextMenu>
    );
}
