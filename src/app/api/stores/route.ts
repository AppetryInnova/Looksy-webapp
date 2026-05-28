import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import logger from '@/lib/logger';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const lat = searchParams.get('lat');
        const lng = searchParams.get('lng');
        const mine = searchParams.get('mine') === 'true';

        const latNum = lat ? parseFloat(lat) : null;
        const lngNum = lng ? parseFloat(lng) : null;
        const GOOGLE_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

        const session = await getServerSession(authOptions);

        let stores: Record<string, unknown>[] = [];

        // 1. If mine=true, only return user's stores
        if (mine && session?.user) {
            const myStores = await prisma.store.findMany({
                where: { ownerId: (session.user as any).id },
                include: {
                    items: {
                        where: { inStock: true },
                        take: 5
                    }
                }
            });
            return NextResponse.json(myStores);
        }

        // 2. Try Google Places API if Key exists (only if not requested "mine")
        if (!mine && GOOGLE_API_KEY && latNum && lngNum) {
            try {
                const radius = 5000; // 5km
                const type = 'clothing_store';
                const googleUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latNum},${lngNum}&radius=${radius}&type=${type}&key=${GOOGLE_API_KEY}`;

                const googleRes = await fetch(googleUrl);
                const googleData = await googleRes.json();

                if (googleData.results) {
                    stores = googleData.results.map((place: { place_id: string, name: string, vicinity: string, geometry: { location: { lat: number, lng: number } }, rating?: number, photos?: { photo_reference: string }[], opening_hours?: { open_now: boolean } }) => ({
                        id: place.place_id,
                        name: place.name,
                        address: place.vicinity,
                        lat: place.geometry.location.lat,
                        lng: place.geometry.location.lng,
                        type: 'Retail',
                        rating: place.rating || 4.0,
                        imageUrl: place.photos?.[0]?.photo_reference
                            ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${place.photos[0].photo_reference}&key=${GOOGLE_API_KEY}`
                            : 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=800',
                        isOpen: place.opening_hours?.open_now,
                        source: 'google'
                    }));
                }
            } catch (err) {
                logger.error("Google Places API Error:", err);
            }
        }

        // 3. Fallback to Database Stores
        const dbStores = await prisma.store.findMany({
            include: {
                items: {
                    where: { inStock: true },
                    take: 5
                }
            }
        });

        // Calculate distances for DB stores
        let dbStoresWithDist = [];
        if (latNum && lngNum) {
            const R = 6371;
            dbStoresWithDist = dbStores.map(store => {
                const dLat = (store.lat - latNum) * (Math.PI / 180);
                const dLon = (store.lng - lngNum) * (Math.PI / 180);
                const a =
                    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                    Math.cos(latNum * (Math.PI / 180)) * Math.cos(store.lat * (Math.PI / 180)) *
                    Math.sin(dLon / 2) * Math.sin(dLon / 2);
                const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                const d = R * c;
                return { ...store, distance: parseFloat(d.toFixed(1)) };
            });
        } else {
            dbStoresWithDist = dbStores.map(s => ({ ...s, distance: 0 }));
        }

        let finalStores = [...stores, ...dbStoresWithDist];

        // Sort by distance
        finalStores.sort((a: { distance?: number }, b: { distance?: number }) => (a.distance || 0) - (b.distance || 0));

        return NextResponse.json(finalStores);

    } catch (error) {
        logger.error('Error fetching stores:', error);
        return NextResponse.json({ error: 'Failed to fetch stores' }, { status: 500 });
    }
}



export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { name, address, lat, lng, type } = body;

        const store = await (prisma.store as any).create({
            data: {
                name,
                address: address || '',
                lat: lat || -34.6037, // Default Buenos Aires
                lng: lng || -58.3816,
                type,
                ownerId: (session.user as any).id
            }
        });

        return NextResponse.json(store);
    } catch (error) {
        logger.error('Error creating store:', error);
        return NextResponse.json({ error: 'Failed to create store' }, { status: 500 });
    }
}
