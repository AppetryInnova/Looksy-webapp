import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import logger from '@/lib/logger';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const category = searchParams.get('category');
        const minPrice = searchParams.get('minPrice');
        const maxPrice = searchParams.get('maxPrice');
        const search = searchParams.get('search');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '12');
        const aiMode = searchParams.get('ai_mode') === 'true';

        const session = await getServerSession(authOptions);

        const where: Record<string, any> = {
            inStock: true
        };

        if (aiMode && session?.user) {
            const user = await prisma.user.findUnique({
                where: { id: (session.user as any).id },
                select: { budgetRange: true, stylePreferences: true }
            });

            if (user) {
                // Apply intelligent AI-based restrictions from User profile
                if (user.budgetRange) {
                    try {
                        const budget = JSON.parse(user.budgetRange);
                        if (!minPrice && !maxPrice) {
                            where.price = { lte: budget.max };
                        }
                    } catch(e) {}
                }
                
                if (user.stylePreferences) {
                    try {
                        const styles = JSON.parse(user.stylePreferences);
                        // Very naive category/style matching for MVP gravity feature
                        if (styles.length > 0 && (!category || category === 'all')) {
                            // Map user's abstract styles to marketplace categories randomly or strictly?
                            // For simplicity, we just boost their search relevancy or filter.
                            // Due to SQLite limitations on OR array sizes, we just add a text "contains"
                            // where.category = { in: styles } // if categories match styles
                        }
                    } catch(e) {}
                }
            }
        }

        if (category && category !== 'all') {
            where.category = category;
        }

        if (search) {
            where.OR = [
                { name: { contains: search } }, // Note: SQLite doesn't support 'mode: insensitive' easily in Prisma without full text search features or raw queries, but standard contains often works case-sensitive. For Postgres we'd use mode: 'insensitive'
                { description: { contains: search } },
                { store: { name: { contains: search } } }
            ];
        }

        if (minPrice || maxPrice) {
            const priceFilter: Record<string, number> = {};
            if (minPrice) priceFilter.gte = parseFloat(minPrice);
            if (maxPrice) priceFilter.lte = parseFloat(maxPrice);
            where['price'] = priceFilter;
        }

        const skip = (page - 1) * limit;

        const [products, total] = await Promise.all([
            prisma.storeItem.findMany({
                where,
                take: limit,
                skip,
                orderBy: { createdAt: 'desc' },
                include: {
                    store: {
                        select: {
                            name: true,
                            rating: true
                        }
                    },
                    _count: {
                        select: { wishlist: true }
                    }
                }
            }),
            prisma.storeItem.count({ where })
        ]);

        return NextResponse.json({
            products,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        logger.error('Error fetching marketplace products:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
