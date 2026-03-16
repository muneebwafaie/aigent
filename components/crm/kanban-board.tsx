"use client";

import React, { useMemo, useState } from "react";
import {
    DndContext,
    DragOverlay,
    closestCorners,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragStartEvent,
    DragOverEvent,
    DragEndEvent,
    defaultDropAnimationSideEffects,
} from "@dnd-kit/core";
import {
    SortableContext,
    arrayMove,
    sortableKeyboardCoordinates,
    horizontalListSortingStrategy,
} from "@dnd-kit/sortable";

import { KanbanColumn } from "./kanban-column";
import { KanbanCard } from "./kanban-card";
import { Id } from "@/convex/_generated/dataModel";

export type Opportunity = {
    _id: Id<"opportunities">;
    _creationTime: number;
    campaignId: Id<"campaigns">;
    accountId?: Id<"accounts">;
    contactId?: Id<"contacts">;
    title: string;
    value: number;
    probability: number;
    stageIndex: number;
    expectedCloseDate?: number;
    assignedUserIds?: string[];
    followerIds?: string[];
    assignerIds?: string[];
};

interface KanbanBoardProps {
    stages: string[];
    opportunities: Opportunity[];
    onMoveOpp: (oppId: Id<"opportunities">, newStageIndex: number) => void;
    onOppClick: (opp: Opportunity) => void;
    onDeleteOpp?: (oppId: Id<"opportunities">) => void;
    onEditOpp?: (opp: Opportunity) => void;
    pendingOpportunityIds?: Set<Id<"opportunities">>;
}

export function KanbanBoard({
    stages,
    opportunities,
    onMoveOpp,
    onOppClick,
    onDeleteOpp,
    onEditOpp,
    pendingOpportunityIds = new Set(),
}: KanbanBoardProps) {
    // We keep a local state of opportunities for immediate UI updates while dragging
    const [activeId, setActiveId] = useState<Id<"opportunities"> | null>(null);
    const [localOpps, setLocalOpps] = useState<Opportunity[]>(opportunities);

    // Sync local state when external data changes, but not while dragging OR when a mutation is likely pending
    // We use a small timeout to allow optimistic update to settle
    React.useEffect(() => {
        if (!activeId) {
            const timer = setTimeout(() => {
                setLocalOpps(opportunities);
            }, 50);
            return () => clearTimeout(timer);
        }
    }, [opportunities, activeId]);

    const columns = useMemo(() => {
        return stages.map((stage, index) => ({
            id: index.toString(),
            title: stage,
            index,
        }));
    }, [stages]);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    return (
        <div className="flex h-full w-full gap-4 overflow-x-auto pb-4">
            <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragStart={onDragStart}
                onDragOver={onDragOver}
                onDragEnd={onDragEnd}
            >
                {columns.map((col) => {
                    const columnOpps = localOpps.filter((opp) => opp.stageIndex === col.index);

                    return (
                        <KanbanColumn
                            key={col.id}
                            column={col}
                            stages={stages}
                            opportunities={columnOpps}
                            onOppClick={onOppClick}
                            onMoveOpp={onMoveOpp}
                            onDeleteOpp={onDeleteOpp}
                            onEditOpp={onEditOpp}
                            pendingOpportunityIds={pendingOpportunityIds}
                        />
                    );
                })}

                <DragOverlay
                    dropAnimation={{
                        sideEffects: defaultDropAnimationSideEffects({
                            styles: {
                                active: {
                                    opacity: "0.4",
                                },
                            },
                        }),
                    }}
                >
                    {activeId ? (
                        <KanbanCard
                            opportunity={localOpps.find((opp) => opp._id === activeId)!}
                            isOverlay
                        />
                    ) : null}
                </DragOverlay>
            </DndContext>
        </div>
    );

    function onDragStart(event: DragStartEvent) {
        const { active } = event;
        setActiveId(active.id as Id<"opportunities">);
    }

    function onDragOver(event: DragOverEvent) {
        const { active, over } = event;
        if (!over) return;

        const activeId = active.id;
        const overId = over.id;

        if (activeId === overId) return;

        const isActiveOpp = active.data.current?.type === "Opportunity";
        const isOverOpp = over.data.current?.type === "Opportunity";
        const isOverColumn = over.data.current?.type === "Column";

        if (!isActiveOpp) return;

        // Dropping an opp over another opp
        if (isActiveOpp && isOverOpp) {
            setLocalOpps((opps) => {
                const activeIndex = opps.findIndex((o) => o._id === activeId);
                const overIndex = opps.findIndex((o) => o._id === overId);

                if (opps[activeIndex].stageIndex !== opps[overIndex].stageIndex) {
                    const newOpps = [...opps];
                    newOpps[activeIndex] = {
                        ...newOpps[activeIndex],
                        stageIndex: opps[overIndex].stageIndex,
                    };
                    return arrayMove(newOpps, activeIndex, overIndex);
                }

                return arrayMove(opps, activeIndex, overIndex);
            });
        }

        // Dropping an opp over an empty column
        if (isActiveOpp && isOverColumn) {
            setLocalOpps((opps) => {
                const activeIndex = opps.findIndex((o) => o._id === activeId);
                const newOpps = [...opps];
                newOpps[activeIndex] = {
                    ...newOpps[activeIndex],
                    stageIndex: over.data.current?.column.index,
                };
                return arrayMove(newOpps, activeIndex, activeIndex);
            });
        }
    }

    function onDragEnd(event: DragEndEvent) {
        setActiveId(null);

        const { active, over } = event;
        if (!over) return;

        const activeId = active.id as Id<"opportunities">;
        const isOverOpp = over.data.current?.type === "Opportunity";
        const isOverColumn = over.data.current?.type === "Column";

        let newStageIndex: number | null = null;

        if (isOverOpp) {
            const overIndex = localOpps.findIndex((o) => o._id === over.id);
            newStageIndex = localOpps[overIndex].stageIndex;
        } else if (isOverColumn) {
            newStageIndex = over.data.current?.column.index;
        }

        // Call the API if the stage actually changed
        const originalOpp = opportunities.find((o) => o._id === activeId);
        if (newStageIndex !== null && originalOpp && originalOpp.stageIndex !== newStageIndex) {
            onMoveOpp(activeId, newStageIndex);
        }
    }
}
