
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Image from "next/image";
import HiringClient from "@/components/business/HiringClient"; // Client component for actions

export default async function ManageCampaignPage({ params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);
    const { id } = await params;

    if (!session?.user) {
        redirect("/api/auth/signin");
    }

    const campaign = await prisma.campaign.findUnique({
        where: { id },
        include: {
            store: true,
            applications: {
                include: {
                    user: {
                        include: {
                            socialConnections: true // To get follower counts if available
                            // Note: We'll assume user model has what we need or compute it
                        }
                    }
                },
                // Sort applications logic? Prisma handles basic sorting.
                // We'll sort by 'followers' in code as it's computed.
            }
        }
    });

    if (!campaign || campaign.store.ownerId !== (session.user as any).id) {
        return <div className="p-8">Unauthorized access.</div>;
    }

    // Sort applications by "followers" (Mocking follower count if not in DB)
    const applicants = campaign.applications.map(app => {
        // Calculate total followers from social connections
        const followerCount = app.user.socialConnections.reduce((acc, curr) => acc + curr.followerCount, 0)
            || 1000; // Fallback for demo
        return {
            ...app,
            followerCount
        };
    }).sort((a, b) => b.followerCount - a.followerCount); // Highest first

    return (
        <div className="p-6 max-w-4xl mx-auto pb-24">
            <header className="mb-8">
                <h1 className="text-3xl font-bold mb-2">{campaign.title}</h1>
                <div className="flex gap-4 text-sm text-gray-500">
                    <span className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full">{campaign.status}</span>
                    <span>Budget: ${campaign.budget}</span>
                    <span>{applicants.length} Applicants</span>
                </div>
            </header>

            <section>
                <h2 className="text-xl font-bold mb-4">Applicants (Ranked by Followers)</h2>

                <div className="grid gap-4">
                    {applicants.map(app => (
                        <div key={app.id} className="card p-4 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden relative">
                                    {app.user.image ? (
                                        <Image src={app.user.image} alt={app.user.name || "User"} fill className="object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-500 font-bold">
                                            {app.user.name?.[0]}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <h3 className="font-bold">{app.user.name}</h3>
                                    <p className="text-emerald-600 font-medium">{app.followerCount.toLocaleString()} Followers</p>
                                    <p className="text-xs text-gray-400">Status: {app.contractStatus}</p>
                                </div>
                            </div>

                            <HiringClient
                                campaignId={campaign.id}
                                applicantId={app.userId}
                                contractStatus={app.contractStatus}
                            />
                        </div>
                    ))}

                    {applicants.length === 0 && (
                        <p className="text-gray-500 italic">No applications yet.</p>
                    )}
                </div>
            </section>
        </div>
    );
}
