// API Response Types
export interface ApiResponse<T = any> {
    data?: T;
    error?: string;
    message?: string;
}

export interface ApiErrorResponse {
    error: string;
    status: number;
    details?: any;
}

// Campaign Types
export interface CampaignCreateRequest {
    title: string;
    description: string;
    budget: number | string;
    requirements: string | object;
    imageUrl?: string;
    storeId?: string;
    reward?: string;
}

// Store Types
export interface StoreCreateRequest {
    name: string;
    description?: string;
    address: string;
    lat: number;
    lng: number;
    type: string;
    imageUrl?: string;
    openingHours?: string;
}

export interface StoreWithDistance {
    id: string;
    name: string;
    description?: string | null;
    address: string;
    lat: number;
    lng: number;
    type: string;
    rating: number;
    imageUrl?: string | null;
    openingHours?: string | null;
    distance?: number;
}

// Google Places Types
export interface GooglePlaceResult {
    name: string;
    vicinity: string;
    geometry: {
        location: {
            lat: number;
            lng: number;
        };
    };
    rating?: number;
    photos?: Array<{
        photo_reference: string;
    }>;
    opening_hours?: {
        weekday_text?: string[];
    };
    types?: string[];
}

// Wardrobe Types
export interface WardrobeItem {
    id: string;
    userId: string;
    imageUrl: string;
    category: string;
    color?: string | null;
    brand?: string | null;
    style?: string | null;
    occasion?: string | null;
    season?: string | null;
    createdAt: Date | string;
    updatedAt: Date | string;
}

// User Session Types (extended from next-auth)
export interface ExtendedUser {
    id: string;
    email?: string | null;
    name?: string | null;
    username?: string | null;
    image?: string | null;
    stylePoints?: number;
    level?: string;
}
