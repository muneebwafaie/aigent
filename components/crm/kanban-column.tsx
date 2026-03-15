"use client";

import React from "react";
import { useDroppable } from "@dnd-kit/core";
import {
    SortableContext,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Opportunity } from "./kanban-board";
import { KanbanCard } from "./kanban-card";
import { Id } from "@/convex/_generated/dataModel";

interface KanbanColumnProps {
    column: {
        id: string;
        title: string;
        index: number;
    };
    stages: string[];
    opportunities: Opportunity[];
    onOppClick: (opp: Opportunity) => void;
    onMoveOpp?: (oppId: Id<"opportunities">, newStageIndex: number) => void;
    onDeleteOpp?: (oppId: Id<"opportunities">) => void;
    onEditOpp?: (opp: Opportunity) => void;
    pendingOpportunityIds: Set<Id<"opportunities">>;
}

/**
 * Render a Kanban column that acts as a droppable container and displays its opportunities as sortable cards.
 *
 * @param column - Column metadata containing `id`, `title`, and `index`
 * @param stages - Ordered list of stage names used by each opportunity
 * @param opportunities - Array of opportunities to render inside the column
 * @param onOppClick - Callback invoked with an opportunity when its card is clicked
 * @param onMoveOpp - Optional callback invoked with an opportunity id and target stage index when moved
 * @param onDeleteOpp - Optional callback invoked with an opportunity id when deletion is requested
 * @param onEditOpp - Optional callback invoked with an opportunity when edit is requested
 * @param pendingOpportunityIds - Set of opportunity ids that should be rendered in a pending state
 * @returns The rendered column element containing a header, a droppable area, and the column's opportunity cards
 */
export function KanbanColumn({
    column,
    stages,
    opportunities,
    onOppClick,
    onMoveOpp,
    onDeleteOpp,
    onEditOpp,
    pendingOpportunityIds,
}: KanbanColumnProps) {
    const { setNodeRef } = useDroppable({
        id: column.id,
        data: {
            type: "Column",
            column,
        },
    });

    return (
        <div className="flex w-80 min-w-[320px] flex-col rounded-lg bg-muted/30 p-4">
            <div className="mb-4 flex items-center justify-between">
                <h3 className="font-semibold">{column.title}</h3>
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-xs font-medium">
                    {opportunities.length}
                </span>
            </div>

            <div
                ref={setNodeRef}
                className="flex flex-1 flex-col gap-3 min-h-[200px]"
            >
                <SortableContext
                    items={opportunities.map((o) => o._id)}
                    strategy={verticalListSortingStrategy}
                >
                    {opportunities.map((opp) => (
                        <KanbanCard
                            key={opp._id}
                            opportunity={opp}
                            stages={stages}
                            onClick={() => onOppClick(opp)}
                            onMove={(newStageIndex) => onMoveOpp?.(opp._id, newStageIndex)}
                            onDelete={() => onDeleteOpp?.(opp._id)}
                            onEdit={() => onEditOpp?.(opp)}
                            isPending={pendingOpportunityIds.has(opp._id)}
                        />
                    ))}
                </SortableContext>

                {opportunities.length === 0 && (
                    <div className="flex h-full min-h-[100px] items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 bg-transparent p-4 text-center text-sm text-muted-foreground">
                        Drop here
                    </div>
                )}
            </div>
        </div>
    );
}
