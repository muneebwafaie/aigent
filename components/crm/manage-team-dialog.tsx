"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { MemberManager } from "@/components/crm/member-manager";
import { useState } from "react";

interface ManageTeamDialogProps {
    trigger?: React.ReactNode;
    entityName: string;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    assignedUserIds: string[];
    followerIds: string[];
    assignerIds: string[];
    onToggleAssignee: (userId: string) => Promise<any>;
    onToggleFollower: (userId: string) => Promise<any>;
    onToggleAssigner: (userId: string) => Promise<any>;
}

/**
 * Renders a modal dialog for viewing and managing team roles for a given entity.
 *
 * This component supports both controlled and uncontrolled visibility via the `open` and `onOpenChange` props;
 * when `open` is omitted it manages its own open state internally. The dialog displays a title that includes
 * `entityName` and renders a MemberManager to view and toggle assignees, followers, and assigners.
 *
 * @param trigger - Optional element that will be used as the dialog trigger (rendered inside a DialogTrigger).
 * @param entityName - Name of the entity shown in the dialog title.
 * @param open - Controlled open state; when provided, the component is controlled and will use this value.
 * @param onOpenChange - Callback invoked with the new open state when the dialog visibility changes.
 * @param assignedUserIds - Array of user IDs currently assigned as assignees.
 * @param followerIds - Array of user IDs currently assigned as followers.
 * @param assignerIds - Array of user IDs currently assigned as assigners.
 * @param onToggleAssignee - Async callback invoked with a userId to toggle that user's assignee status.
 * @param onToggleFollower - Async callback invoked with a userId to toggle that user's follower status.
 * @param onToggleAssigner - Async callback invoked with a userId to toggle that user's assigner status.
 * @returns The rendered ManageTeamDialog React element.
 */
export function ManageTeamDialog({
    trigger,
    entityName,
    open: controlledOpen,
    onOpenChange: controlledOnOpenChange,
    assignedUserIds,
    followerIds,
    assignerIds,
    onToggleAssignee,
    onToggleFollower,
    onToggleAssigner,
}: ManageTeamDialogProps) {
    const [uncontrolledOpen, setUncontrolledOpen] = useState(false);

    const isControlled = controlledOpen !== undefined;
    const open = isControlled ? controlledOpen : uncontrolledOpen;
    const onOpenChange = isControlled ? controlledOnOpenChange : setUncontrolledOpen;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Manage Team: {entityName}</DialogTitle>
                    <DialogDescription>
                        Control who has access to this record and what role they hold.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-2">
                    <MemberManager
                        assignedUserIds={assignedUserIds}
                        followerIds={followerIds}
                        assignerIds={assignerIds}
                        onToggleAssignee={onToggleAssignee}
                        onToggleFollower={onToggleFollower}
                        onToggleAssigner={onToggleAssigner}
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
}
