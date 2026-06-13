import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import logger from '@/lib/logger';
import { getUserIdFromRequest } from '@/lib/auth-mobile';

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
        const p2p = searchParams.get('p2p') === 'true';

        const userId = await getUserIdFromRequest(request);

        if (p2p) {
            const where: Record<string, any> = {
                OR: [
                    { isForSale: true },
                    { isForRent: true }
                ]
            };

            if (userId) {
                where.userId = { not: userId };
            }

            if (category && category !== 'all') {
                where.category = { contains: category };
            }

            if (search) {
                where.OR = [
                    { name: { contains: search } },
                    { brand: { contains: search } },
                    { color: { contains: search } },
                    { user: { username: { contains: search } } }
                ];
            }

            if (minPrice || maxPrice) {
                const priceFilter: Record<string, number> = {};
                if (minPrice) priceFilter.gte = parseFloat(minPrice);
                if (maxPrice) priceFilter.lte = parseFloat(maxPrice);
                where.price = priceFilter;
            }

            const skip = (page - 1) * limit;

            const [items, total] = await Promise.all([
                prisma.item.findMany({
                    where,
                    take: limit,
                    skip,
                    orderBy: { createdAt: 'desc' },
                    include: {
                        user: {
                            select: {
                                id: true,
                                username: true,
                                avatarUrl: true
                            }
                        }
                    }
                }),
                prisma.item.count({ where })
            ]);

            const mappedProducts = items.map(item => ({
                id: item.id,
                name: item.name || `${item.color || ''} ${item.brand || ''} ${item.category}`.trim(),
                price: item.price || item.rentalPrice || 0.0,
                rentalPrice: item.rentalPrice,
                isForSale: item.isForSale,
                isForRent: item.isForRent,
                imageUrl: item.imageUrl,
                category: item.category,
                inStock: true,
                store: {
                    id: `user-${item.user?.id || 'unknown'}`,
                    name: item.user?.username || 'Usuario Looksy',
                    rating: 5.0,
                    ownerId: item.userId
                },
                _count: { wishlist: 0 }
            }));

            return NextResponse.json({
                products: mappedProducts,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            });
        }

        const where: Record<string, any> = {
            inStock: true
        };

        if (aiMode && userId) {
            const user = await prisma.user.findUnique({
                where: { id: userId },
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
