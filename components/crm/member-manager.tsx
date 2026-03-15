"use client";

import { useOrganization } from "@clerk/nextjs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ShieldAlert, ShieldCheck, Users, UsersRound } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

interface MemberManagerProps {
    assignedUserIds: string[];
    followerIds: string[];
    assignerIds: string[];
    onToggleAssignee: (userId: string) => Promise<any>;
    onToggleFollower: (userId: string) => Promise<any>;
    onToggleAssigner: (userId: string) => Promise<any>;
    disabled?: boolean;
}

export function MemberManager({
    assignedUserIds,
    followerIds,
    assignerIds,
    onToggleAssignee,
    onToggleFollower,
    onToggleAssigner,
    disabled = false,
}: MemberManagerProps) {
    const { organization, memberships, isLoaded } = useOrganization({
        memberships: {
            keepPreviousData: true,
        },
    });

    const [isLoadingToggle, setIsLoadingToggle] = useState<Record<string, boolean>>({});

    if (!isLoaded) {
        return <div className="p-4 text-sm text-muted-foreground animate-pulse">Loading members...</div>;
    }

    if (!organization) {
        return <div className="p-4 text-sm text-muted-foreground">Organization context required.</div>;
    }

    const members = memberships?.data || [];

    const handleToggle = async (userId: string, action: "assignee" | "follower" | "assigner") => {
        if (disabled) return;

        setIsLoadingToggle(prev => ({ ...prev, [`${userId}-${action}`]: true }));
        try {
            if (action === "assignee") await onToggleAssignee(userId);
            if (action === "follower") await onToggleFollower(userId);
            if (action === "assigner") await onToggleAssigner(userId);
        } catch (error: any) {
            toast.error(error.message || `Failed to update ${action}`);
        } finally {
            setIsLoadingToggle(prev => ({ ...prev, [`${userId}-${action}`]: false }));
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
                <UsersRound className="size-4 text-muted-foreground" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Access & Membership</h3>
            </div>

            <div className="rounded-md border bg-card text-card-foreground shadow-sm overflow-hidden">
                <div className="grid grid-cols-[1fr_80px_80px_80px] sm:grid-cols-[1fr_100px_100px_100px] gap-2 p-3 bg-muted/50 border-b text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    <div>Member</div>
                    <div className="text-center flex items-center justify-center gap-1" title="Assignees can edit and manage this record">
                        <Users className="size-3" /> Assigned
                    </div>
                    <div className="text-center flex items-center justify-center gap-1" title="Followers get read-only access">
                        <ShieldCheck className="size-3" /> Follower
                    </div>
                    <div className="text-center flex items-center justify-center gap-1" title="Assigners can modify these access lists">
                        <ShieldAlert className="size-3 text-destructive" /> Assigner
                    </div>
                </div>

                <ScrollArea className="h-[250px]">
                    <div className="flex flex-col divide-y">
                        {members.length === 0 ? (
                            <div className="p-4 text-center text-sm text-muted-foreground">No organization members found.</div>
                        ) : (
                            members.map((mem) => {
                                const userId = mem.publicUserData?.userId;
                                if (!userId || !mem.publicUserData) return null;

                                const isAssigned = assignedUserIds.includes(userId);
                                const isFollower = followerIds.includes(userId);
                                const isAssigner = assignerIds.includes(userId);
                                const isOrgAdmin = mem.role === "org:admin";

                                return (
                                    <div key={userId} className="grid grid-cols-[1fr_80px_80px_80px] sm:grid-cols-[1fr_100px_100px_100px] gap-2 p-3 items-center hover:bg-accent/30 transition-colors">
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <Avatar className="size-8 shrink-0 border">
                                                <AvatarImage src={mem.publicUserData.imageUrl} />
                                                <AvatarFallback className="text-[10px]">
                                                    {mem.publicUserData?.firstName?.[0]}
                                                    {mem.publicUserData?.lastName?.[0]}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex flex-col truncate">
                                                <span className="text-sm font-medium truncate">
                                                    {mem.publicUserData?.firstName} {mem.publicUserData?.lastName}
                                                </span>
                                                <div className="flex gap-1 mt-0.5">
                                                    {isOrgAdmin && (
                                                        <Badge variant="secondary" className="text-[8px] h-3 px-1.5 uppercase font-bold py-0">Admin</Badge>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex justify-center">
                                            <Checkbox
                                                checked={isAssigned}
                                                onCheckedChange={() => handleToggle(userId, "assignee")}
                                                disabled={disabled || isLoadingToggle[`${userId}-assignee`]}
                                                className="data-[state=checked]:bg-primary"
                                            />
                                        </div>

                                        <div className="flex justify-center">
                                            <Checkbox
                                                checked={isFollower}
                                                onCheckedChange={() => handleToggle(userId, "follower")}
                                                disabled={disabled || isLoadingToggle[`${userId}-follower`]}
                                            />
                                        </div>

                                        <div className="flex justify-center">
                                            <Checkbox
                                                checked={isAssigner}
                                                onCheckedChange={() => handleToggle(userId, "assigner")}
                                                disabled={disabled || isLoadingToggle[`${userId}-assigner`]}
                                                className="data-[state=checked]:bg-destructive data-[state=checked]:border-destructive"
                                            />
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </ScrollArea>
            </div>
        </div>
    );
}
