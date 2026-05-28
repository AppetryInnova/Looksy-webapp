"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { logger } from "@/lib/logger";

export default function CreateStorePage() {
    const router = useRouter();
    const t = useTranslations("Business");
    const [isLoading, setIsLoading] = useState(false);
    const [name, setName] = useState("");
    const [address, setAddress] = useState("");
    const [type, setType] = useState("Boutique");

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setIsLoading(true);

        try {
            const res = await fetch('/api/stores', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, address, type })
            });

            if (res.ok) {
                router.push('/business');
                router.refresh();
            } else {
                alert(t("errorCreating")); // Note: I should add errorCreating if not there, or generic one.
            }
        } catch (err) {
            logger.error('Error creating store:', err);
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="p-8 max-w-lg mx-auto min-h-screen">
            <h1 className="text-2xl font-bold mb-6">{t("createStore")}</h1>
            <form onSubmit={handleSubmit} className="space-y-6 card p-6">
                <div>
                    <label htmlFor="name" className="block text-sm font-medium mb-2">{t("storeName")}</label>
                    <input
                        id="name"
                        className="w-full p-3 rounded-lg border border-gray-300"
                        value={name} onChange={e => setName(e.target.value)} required
                    />
                </div>
                <div>
                    <label htmlFor="address" className="block text-sm font-medium mb-2">{t("address")}</label>
                    <input
                        id="address"
                        className="w-full p-3 rounded-lg border border-gray-300"
                        value={address} onChange={e => setAddress(e.target.value)} required
                    />
                </div>
                <div>
                    <label htmlFor="type" className="block text-sm font-medium mb-2">{t("type")}</label>
                    <select
                        id="type"
                        className="w-full p-3 rounded-lg border border-gray-300"
                        value={type} onChange={e => setType(e.target.value)}
                    >
                        <option>Boutique</option>
                        <option>Brand</option>
                        <option>Vintage</option>
                        <option>Retail</option>
                    </select>
                </div>
                <button type="submit" disabled={isLoading} className="btn-primary w-full">
                    {isLoading ? t("creating") : t("createStoreBtn")}
                </button>
            </form>
        </div>
    );
}
