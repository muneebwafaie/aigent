"use client";

import { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Opportunity } from "./kanban-board";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { MemberManager } from "./member-manager";

import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { format } from "date-fns";
import {
    Trash2,
    Target,
    Building2,
    User2,
    Megaphone,
    DollarSign,
    Calendar,
    BarChart3,
    TrendingUp,
    X
} from "lucide-react";

interface OpportunityEditSheetProps {
    opportunity: Opportunity | null;
    isOpen: boolean;
    onClose: () => void;
    stages: string[];
}

/**
 * Render an editable sheet UI for modifying an Opportunity.
 *
 * Presents a tabbed form that lets users edit core opportunity fields (title, account, contact, campaign, value,
 * probability, stage, and expected close date), manage members (assignees, followers, assigners), update or delete the
 * opportunity via Convex mutations, and fetch related lists (accounts, contacts, campaigns) for link fields.
 *
 * @param opportunity - The Opportunity to edit; if `null`, the component renders nothing.
 * @param isOpen - Controls whether the sheet is open and visible.
 * @param onClose - Callback invoked to close the sheet.
 * @param stages - Ordered list of pipeline stage names used to populate the stage selector and header.
 * @returns The sheet React element for editing the provided opportunity, or `null` if `opportunity` is `null`.
 */
export function OpportunityEditSheet({ opportunity, isOpen, onClose, stages }: OpportunityEditSheetProps) {
    const [formData, setFormData] = useState({
        title: "",
        accountId: "none",
        contactId: "none",
        campaignId: "none",
        value: "",
        probability: "50",
        stageIndex: 0,
        expectedCloseDate: "",
    });

    const updateOpp = useMutation(api.crm.opportunities.update);
    const deleteOpp = useMutation(api.crm.opportunities.remove);
    const toggleAssignee = useMutation(api.crm.opportunities.toggleAssignee);
    const toggleFollower = useMutation(api.crm.opportunities.toggleFollower);
    const toggleAssigner = useMutation(api.crm.opportunities.toggleAssigner);

    const accounts = useQuery(api.crm.accounts.list);
    const contacts = useQuery(api.crm.contacts.list);
    const campaigns = useQuery(api.crm.campaigns.list, {});

    useEffect(() => {
        if (opportunity) {
            setFormData({
                title: opportunity.title,
                accountId: opportunity.accountId || "none",
                contactId: opportunity.contactId || "none",
                campaignId: opportunity.campaignId || "none",
                value: opportunity.value ? opportunity.value.toString() : "",
                probability: opportunity.probability ? opportunity.probability.toString() : "50",
                stageIndex: opportunity.stageIndex,
                expectedCloseDate: opportunity.expectedCloseDate
                    ? format(new Date(opportunity.expectedCloseDate), "yyyy-MM-dd")
                    : "",
            });
        }
    }, [opportunity]);

    if (!opportunity) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title.trim()) return toast.error("Title is required");

        try {
            await updateOpp({
                id: opportunity._id,
                accountId: formData.accountId === "none" ? undefined : formData.accountId as Id<"accounts">,
                contactId: formData.contactId === "none" ? undefined : formData.contactId as Id<"contacts">,
                campaignId: formData.campaignId === "none" ? undefined : formData.campaignId as Id<"campaigns">,
                title: formData.title.trim(),
                value: formData.value ? parseFloat(formData.value) : 0,
                probability: formData.probability ? parseInt(formData.probability) : 50,
                stageIndex: formData.stageIndex,
                expectedCloseDate: formData.expectedCloseDate ? new Date(formData.expectedCloseDate).getTime() : undefined,
            });
            toast.success("Opportunity updated");
            onClose();
        } catch (error: any) {
            toast.error(error.message);
        }
    };

    const handleDelete = async () => {
        if (confirm("Are you sure you want to delete this opportunity? This cannot be undone.")) {
            try {
                await deleteOpp({ id: opportunity._id });
                toast.success("Opportunity deleted");
                onClose();
            } catch (error: any) {
                toast.error("Failed to delete: " + error.message);
            }
        }
    };

    return (
        <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <SheetContent showCloseButton={false} className="overflow-y-auto sm:max-w-2xl p-0 border-l bg-background shadow-2xl flex flex-col h-full">
                <Tabs defaultValue="details" className="w-full flex-1 flex flex-col overflow-hidden">
                    {/* Modern Header - Precise and Accessible with Integrated Tabs */}
                    <SheetHeader className="flex flex-col px-6 py-0 border-b bg-muted/30 sticky top-0 z-20 backdrop-blur-md space-y-0">
                        <div className="flex items-center justify-between py-4">
                            <div className="flex items-center gap-3">
                                <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                    <Target className="size-4" />
                                </div>
                                <div className="flex flex-col text-left">
                                    <SheetTitle className="text-sm font-bold tracking-tight text-foreground leading-none">
                                        {formData.title || "Untitled Opportunity"}
                                    </SheetTitle>
                                    <SheetDescription className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mt-1">
                                        {stages[formData.stageIndex]} • Win Prob. {formData.probability}%
                                    </SheetDescription>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                <Button variant="ghost" size="icon" onClick={handleDelete} title="Delete Opportunity" className="size-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                                    <Trash2 className="size-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={onClose} title="Close" className="size-8 text-muted-foreground hover:bg-accent transition-colors">
                                    <X className="size-4" />
                                </Button>
                            </div>
                        </div>

                        <TabsList className="flex w-full justify-start gap-6 bg-transparent border-none h-10 p-0 rounded-none relative">
                            <TabsTrigger
                                value="details"
                                className="px-0 h-10 text-[11px] font-bold rounded-none border-b-2 border-transparent data-[state=active]:bg-transparent data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none transition-all text-muted-foreground"
                            >
                                Opportunity Details
                            </TabsTrigger>
                        </TabsList>
                    </SheetHeader>

                    <div className="flex-1 overflow-y-auto">
                        <TabsContent value="details" className="p-6 focus-visible:ring-0 mt-0">
                            <form onSubmit={handleSubmit} className="space-y-8">
                                {/* Core Identity */}
                                <div className="space-y-4">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="edit-title" className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
                                            Opportunity Name
                                        </Label>
                                        <Input
                                            id="edit-title"
                                            value={formData.title}
                                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                            className="h-10 text-sm font-semibold border-input focus-visible:ring-1 focus-visible:ring-primary/20 focus-visible:border-primary transition-all bg-background"
                                            placeholder="e.g. Q4 Global Expansion"
                                            required
                                        />
                                    </div>
                                </div>

                                <Separator className="opacity-50" />

                                {/* High-Density Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="edit-account" className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold flex items-center gap-2">
                                            <Building2 className="size-3 text-primary/60" /> Account
                                        </Label>
                                        <Select
                                            value={formData.accountId}
                                            onValueChange={(val) => setFormData({ ...formData, accountId: val })}
                                        >
                                            <SelectTrigger id="edit-account" className="h-9 text-xs border-input hover:border-primary transition-all bg-background shadow-sm">
                                                <SelectValue placeholder="Link Account" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none" className="text-xs">-- None --</SelectItem>
                                                {accounts?.map((acc) => (
                                                    <SelectItem key={acc._id} value={acc._id} className="text-xs">{acc.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label htmlFor="edit-contact" className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold flex items-center gap-2">
                                            <User2 className="size-3 text-primary/60" /> Primary Contact
                                        </Label>
                                        <Select
                                            value={formData.contactId}
                                            onValueChange={(val) => setFormData({ ...formData, contactId: val })}
                                        >
                                            <SelectTrigger id="edit-contact" className="h-9 text-xs border-input hover:border-primary transition-all bg-background shadow-sm">
                                                <SelectValue placeholder="Link Contact" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none" className="text-xs">-- None --</SelectItem>
                                                {contacts?.map((contact) => (
                                                    <SelectItem key={contact._id} value={contact._id} className="text-xs">
                                                        {contact.firstName} {contact.lastName}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-1.5 md:col-span-2">
                                        <Label htmlFor="edit-campaign" className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold flex items-center gap-2">
                                            <Megaphone className="size-3 text-primary/60" /> Marketing Campaign
                                        </Label>
                                        <Select
                                            value={formData.campaignId || "none"}
                                            onValueChange={(value) => setFormData({ ...formData, campaignId: value === "none" ? "none" : value as Id<"campaigns"> })}
                                        >
                                            <SelectTrigger id="edit-campaign" className="h-9 text-xs border-input hover:border-primary transition-all bg-background shadow-sm">
                                                <SelectValue placeholder="Select Origin" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none" className="text-xs">-- None --</SelectItem>
                                                {campaigns?.map((camp) => (
                                                    <SelectItem key={camp._id} value={camp._id} className="text-xs">
                                                        {camp.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="p-4 rounded-xl border bg-accent/30 space-y-6">
                                    <h3 className="text-[10px] uppercase tracking-[0.2em] font-black text-foreground/40">Financials & Projection</h3>

                                    <div className="grid grid-cols-2 gap-8">
                                        <div className="space-y-1.5">
                                            <Label htmlFor="edit-value" className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold flex items-center gap-2">
                                                <DollarSign className="size-3 text-green-600" /> Contract Value
                                            </Label>
                                            <div className="relative group">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground group-focus-within:text-primary">$</span>
                                                <Input
                                                    id="edit-value"
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    value={formData.value}
                                                    onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                                                    className="h-9 pl-7 text-sm font-bold border-input focus-visible:ring-1 focus-visible:ring-primary/20 focus-visible:border-primary transition-all bg-background shadow-sm"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label htmlFor="edit-expectedCloseDate" className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold flex items-center gap-2">
                                                <Calendar className="size-3 text-orange-600" /> Target Close
                                            </Label>
                                            <Input
                                                id="edit-expectedCloseDate"
                                                type="date"
                                                value={formData.expectedCloseDate}
                                                onChange={(e) => setFormData({ ...formData, expectedCloseDate: e.target.value })}
                                                className="h-9 text-xs border-input bg-background focus-visible:ring-1 focus-visible:ring-primary/20 focus-visible:border-primary font-semibold shadow-sm"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-2">
                                        <div className="space-y-1.5">
                                            <Label htmlFor="edit-stageIndex" className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold flex items-center gap-2">
                                                <BarChart3 className="size-3 text-indigo-600" /> Pipeline Stage
                                            </Label>
                                            <Select
                                                value={formData.stageIndex.toString()}
                                                onValueChange={(val) => setFormData({ ...formData, stageIndex: parseInt(val) })}
                                            >
                                                <SelectTrigger id="edit-stageIndex" className="h-9 text-xs border-input hover:border-primary transition-all bg-background shadow-sm">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {stages.map((stage, idx) => (
                                                        <SelectItem key={idx} value={idx.toString()} className="text-xs">{stage}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label htmlFor="edit-prob" className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold flex items-center gap-2">
                                                <TrendingUp className="size-3 text-blue-600" /> Success Confidence
                                            </Label>
                                            <div className="flex items-center gap-4 h-9">
                                                <div className="flex-1 h-1.5 bg-muted rounded-full relative overflow-hidden">
                                                    <motion.div
                                                        className={cn(
                                                            "h-full rounded-full transition-all duration-500",
                                                            parseInt(formData.probability) > 70 ? "bg-green-500" :
                                                                parseInt(formData.probability) > 40 ? "bg-blue-500" : "bg-orange-500"
                                                        )}
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${formData.probability}%` }}
                                                    />
                                                </div>
                                                <div className="flex items-center gap-1 shrink-0">
                                                    <Input
                                                        id="edit-prob"
                                                        type="number"
                                                        min="0"
                                                        max="100"
                                                        value={formData.probability}
                                                        onChange={(e) => setFormData({ ...formData, probability: e.target.value })}
                                                        className="h-8 w-12 text-xs font-bold border-none bg-accent/50 text-right focus-visible:ring-0 p-1 rounded-md"
                                                    />
                                                    <span className="text-[10px] font-black opacity-30">%</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <Separator className="opacity-50" />

                                <MemberManager
                                    assignedUserIds={opportunity.assignedUserIds || []}
                                    followerIds={opportunity.followerIds || []}
                                    assignerIds={opportunity.assignerIds || []}
                                    onToggleAssignee={(userId) => toggleAssignee({ id: opportunity._id, userId })}
                                    onToggleFollower={(userId) => toggleFollower({ id: opportunity._id, userId })}
                                    onToggleAssigner={(userId) => toggleAssigner({ id: opportunity._id, userId })}
                                />

                                {/* Integrated Save Bar */}
                                <div className="fixed bottom-0 right-0 left-0 sm:left-auto sm:w-[calc(100vw-var(--sidebar-width,0px))] md:w-2xl p-4 border-t bg-background/80 backdrop-blur-md flex items-center justify-end gap-3 z-30">
                                    <Button type="button" variant="ghost" onClick={onClose} className="h-9 text-xs font-bold px-6">
                                        Discard
                                    </Button>
                                    <Button type="submit" className="h-9 text-xs font-bold px-8 bg-primary text-primary-foreground hover:shadow-lg hover:shadow-primary/20 transition-all">
                                        Update Opportunity
                                    </Button>
                                </div>
                                <div className="h-20" /> {/* Spacer for save bar */}
                            </form>
                        </TabsContent>
                    </div>
                </Tabs>
            </SheetContent>
        </Sheet>
    );
}
