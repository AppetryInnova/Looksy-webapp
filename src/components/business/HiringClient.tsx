
"use client";

import { useState } from "react";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Check } from "lucide-react";
import logger from '@/lib/logger';
import posthog from 'posthog-js';


export default function HiringClient({ campaignId, applicantId, contractStatus }: { campaignId: string, applicantId: string, contractStatus: string }) {
    const [status, setStatus] = useState(contractStatus);
    const [isLoading, setIsLoading] = useState(false);

    async function handleHire() {
        if (!confirm("Are you sure you want to hire this influencer? This will generate a contract.")) return;
        setIsLoading(true);
        try {
            const res = await fetch(`/api/campaigns/${campaignId}/hire`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ applicantId })
            });
            if (res.ok) {
                setStatus('SIGNED');
                posthog.capture('influencer_hired', { campaignId, applicantId });
            } else {

                alert("Failed to hire.");
            }
        } catch (e) {
            logger.error(e);
        } finally {
            setIsLoading(false);
        }
    }

    if (status === 'SIGNED' || status === 'HIRED') {
        return (
            <div className="flex items-center gap-2 text-green-600 font-bold bg-green-50 px-4 py-2 rounded-lg">
                <Check size={18} /> Hired
            </div>
        );
    }

    return (
        <button
            onClick={handleHire}
            disabled={isLoading}
            className="btn-primary py-2 px-6 text-sm"
        >
            {isLoading ? "Signing..." : "Hire & Sign"}
        </button>
    );
}
