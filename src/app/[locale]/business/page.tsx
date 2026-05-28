
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import BusinessDashboard from "@/components/business/BusinessDashboard";
import { redirect } from "next/navigation";

export default async function BusinessPage() {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
        redirect("/api/auth/signin?callbackUrl=/business");
    }

    const userId = (session.user as any).id;

    const store = await prisma.store.findFirst({
        where: { ownerId: userId } as any,
        include: {
            campaigns: {
                orderBy: { createdAt: 'desc' }
            }
        } as any
    });

    return <BusinessDashboard store={store} />;
}
