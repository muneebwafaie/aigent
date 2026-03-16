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
