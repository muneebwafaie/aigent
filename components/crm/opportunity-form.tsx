"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { useSafeMutation } from "@/hooks/use-safe-mutation";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface OpportunityFormProps {
    campaignId: Id<"campaigns">;
    onSuccess: () => void;
    stages: string[];
}

export function OpportunityForm({ campaignId, onSuccess, stages }: OpportunityFormProps) {
    const [formData, setFormData] = useState({
        title: "",
        accountId: "none",
        contactId: "none",
        value: "",
        probability: "50",
        stageIndex: 0,
        expectedCloseDate: "",
    });

    const createOpportunity = useSafeMutation(api.crm.opportunities.create);
    const accounts = useQuery(api.crm.accounts.list);
    const contacts = useQuery(api.crm.contacts.list);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.title.trim()) return toast.error("Opportunity title is required");
        const value =
            formData.value === "" ? 0 : Number(formData.value);
        const probability = Number(formData.probability);
        const expectedCloseDate =
            formData.expectedCloseDate === ""
                ? undefined
                : Date.parse(formData.expectedCloseDate);

        if (!Number.isFinite(value) || value < 0) {
            return toast.error("Value must be a valid non-negative number");
        }
        if (!Number.isInteger(probability) || probability < 0 || probability > 100) {
            return toast.error("Probability must be an integer between 0 and 100");
        }
        if (formData.stageIndex < 0 || formData.stageIndex >= stages.length) {
            return toast.error("Please select a valid stage");
        }
        if (expectedCloseDate !== undefined && Number.isNaN(expectedCloseDate)) {
            return toast.error("Expected close date is invalid");
        }

        try {
            await createOpportunity({
                campaignId,
                accountId: formData.accountId === "none" ? undefined : formData.accountId as Id<"accounts">,
                contactId: formData.contactId === "none" ? undefined : formData.contactId as Id<"contacts">,
                title: formData.title.trim(),
                value,
                probability,
                stageIndex: formData.stageIndex,
                expectedCloseDate,
            });
            toast.success("Opportunity created");
            onSuccess();
        } catch (error: any) {
            toast.error(error.message);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <DialogHeader>
                <DialogTitle>New Opportunity</DialogTitle>
                <DialogDescription>
                    Create a new deal to track in this pipeline.
                </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                    <Label htmlFor="title">Opportunity Title *</Label>
                    <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="e.g. Acme Q3 Enterprise Deal"
                        autoFocus
                        required
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="accountId">Account</Label>
                        <select
                            id="accountId"
                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                            value={formData.accountId}
                            onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
                        >
                            <option value="none">-- None --</option>
                            {accounts?.map((acc) => (
                                <option key={acc._id} value={acc._id}>{acc.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="contactId">Primary Contact</Label>
                        <select
                            id="contactId"
                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                            value={formData.contactId}
                            onChange={(e) => setFormData({ ...formData, contactId: e.target.value })}
                        >
                            <option value="none">-- None --</option>
                            {contacts?.map((contact) => (
                                <option key={contact._id} value={contact._id}>
                                    {contact.firstName} {contact.lastName}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="value">Value (\)</Label>
                        <Input
                            id="value"
                            type="number"
                            min="0"
                            step="0.01"
                            value={formData.value}
                            onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                            placeholder="0.00"
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="expectedCloseDate">Expected Close Date</Label>
                        <Input
                            id="expectedCloseDate"
                            type="date"
                            value={formData.expectedCloseDate}
                            onChange={(e) => setFormData({ ...formData, expectedCloseDate: e.target.value })}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="stageIndex">Initial Stage</Label>
                        <select
                            id="stageIndex"
                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                            value={formData.stageIndex.toString()}
                            onChange={(e) => setFormData({ ...formData, stageIndex: parseInt(e.target.value) })}
                        >
                            {stages.map((stage, idx) => (
                                <option key={idx} value={idx}>{stage}</option>
                            ))}
                        </select>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="probability">Probability (%)</Label>
                        <Input
                            id="probability"
                            type="number"
                            min="0"
                            max="100"
                            value={formData.probability}
                            onChange={(e) => setFormData({ ...formData, probability: e.target.value })}
                        />
                    </div>
                </div>
            </div>

            <DialogFooter>
                <Button type="button" variant="outline" onClick={onSuccess}>Cancel</Button>
                <Button type="submit">Save Opportunity</Button>
            </DialogFooter>
        </form>
    );
}
