"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ChevronLeft, Sparkles, Wand2 } from "lucide-react";
import Link from "next/link";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useTranslations } from "next-intl";
import { logger } from "@/lib/logger";

export default function CreateCampaignPage() {
    const router = useRouter();
    const { data: session } = useSession();
    const t = useTranslations("Business");
    const tc = useTranslations("Common");
    const [isLoading, setIsLoading] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        budget: "",
        requirements: "",
        imageUrl: "",
        reward: ""
    });

    async function handleAIGenerate() {
        const topic = prompt("¿Sobre qué trata tu campaña? (Ej: Colección de Invierno, Lanzamiento de Sneakers...)");
        if (!topic) return;

        setIsGenerating(true);
        try {
            const res = await fetch('/api/business/campaigns/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ topic })
            });

            if (res.ok) {
                const data = await res.json();
                setFormData(prev => ({
                    ...prev,
                    title: data.title || prev.title,
                    description: data.description || prev.description,
                    requirements: data.requirements || prev.requirements,
                    reward: data.reward || prev.reward
                }));
            }
        } catch (err) {
            logger.error('Error generating with AI:', err);
        } finally {
            setIsGenerating(false);
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setIsLoading(true);

        try {
            // 1. Get user's store first
            const storeRes = await fetch('/api/stores?mine=true');
            if (!storeRes.ok) {
                alert(t("verifyStoreError"));
                return;
            }
            const stores = await storeRes.json();

            if (!stores || stores.length === 0) {
                alert(t("needStoreError"));
                router.push('/business/create-store');
                return;
            }

            const storeId = stores[0].id; // Use the first store owned by the user

            // 2. Create the campaign
            const res = await fetch('/api/campaigns', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    budget: parseFloat(formData.budget),
                    storeId: storeId
                })
            });

            if (res.ok) {
                router.push('/business');
            } else {
                const errorData = await res.json();
                alert(`${t("createCampaignError")}: ${errorData.error || tc("error")}`);
            }
        } catch (err) {
            logger.error('Error creating campaign:', err);
            alert(t("connectionError"));
        } finally {
            setIsLoading(false);
        }

    }

    return (
        <div className="p-6 max-w-2xl mx-auto pb-24">
            <Link href="/business" className="flex items-center text-gray-500 mb-6 hover:text-emerald-600 transition-colors">
                <ChevronLeft size={20} /> {tc("back")}
            </Link>

            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">{t("newCampaignTitle")}</h1>
                <button
                    type="button"
                    onClick={handleAIGenerate}
                    disabled={isGenerating}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-xl font-bold hover:bg-purple-200 transition-all border border-purple-200 shadow-sm"
                >
                    {isGenerating ? <LoadingSpinner size="small" color="purple" /> : <><Sparkles size={18} /> Optimizar con IA</>}
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">{t("campaignTitleLabel")}</label>
                    <input
                        id="title"
                        type="text"
                        required
                        className="w-full p-4 rounded-xl border border-gray-200 focus:border-emerald-500 outline-none transition-all"
                        placeholder={t("campaignTitlePlaceholder")}
                        value={formData.title}
                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                    />
                </div>

                <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">{t("descriptionLabel")}</label>
                    <textarea
                        id="description"
                        required
                        rows={4}
                        className="w-full p-4 rounded-xl border border-gray-200 focus:border-emerald-500 outline-none transition-all"
                        placeholder={t("descriptionPlaceholder")}
                        value={formData.description}
                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="budget" className="block text-sm font-medium text-gray-700 mb-2">{t("budgetLabel")}</label>
                        <input
                            id="budget"
                            type="number"
                            required
                            className="w-full p-4 rounded-xl border border-gray-200 focus:border-emerald-500 outline-none transition-all"
                            placeholder={t("budgetPlaceholder")}
                            value={formData.budget}
                            onChange={e => setFormData({ ...formData, budget: e.target.value })}
                        />
                    </div>
                    <div>
                        <label htmlFor="reward" className="block text-sm font-medium text-gray-700 mb-2">{t("rewardLabel")}</label>
                        <input
                            id="reward"
                            type="text"
                            required
                            className="w-full p-4 rounded-xl border border-gray-200 focus:border-emerald-500 outline-none transition-all"
                            placeholder={t("rewardPlaceholder")}
                            value={formData.reward}
                            onChange={e => setFormData({ ...formData, reward: e.target.value })}
                        />
                    </div>
                </div>

                <div>
                    <label htmlFor="requirements" className="block text-sm font-medium text-gray-700 mb-2">{t("requirementsLabel")}</label>
                    <input
                        id="requirements"
                        type="text"
                        required
                        className="w-full p-4 rounded-xl border border-gray-200 focus:border-emerald-500 outline-none transition-all"
                        placeholder={t("requirementsPlaceholder")}
                        value={formData.requirements}
                        onChange={e => setFormData({ ...formData, requirements: e.target.value })}
                    />
                </div>

                <div className="pt-4">
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="btn-primary w-full flex justify-center py-4 text-lg"
                    >
                        {isLoading ? <LoadingSpinner size="small" color="white" /> : t("launchCampaign")}
                    </button>
                </div>
            </form>
        </div>
    );
}
