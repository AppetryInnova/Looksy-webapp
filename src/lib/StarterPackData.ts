export type StarterItem = {
    category: string;
    imageUrl: string;
    style: string;
    occasion: string;
    season: string;
    brand: string;
    color: string;
};

export const STARTER_PACKS = {
    MALE: {
        YOUNG: [
            // Tops
            { category: 'TOP', imageUrl: '/wardrobe-images/white-tshirt-casual.png?v=1765835499778', style: 'Casual', occasion: 'Daily', season: 'All', brand: 'Generic', color: 'White' },
            { category: 'TOP', imageUrl: '/wardrobe-images/black-tshirt-streetwear.png?v=1765835499778', style: 'Streetwear', occasion: 'Casual', season: 'All', brand: 'Generic', color: 'Black' },
            { category: 'TOP', imageUrl: '/wardrobe-images/navy-tshirt-casual.png?v=1765835499778', style: 'Casual', occasion: 'Daily', season: 'All', brand: 'Generic', color: 'Navy' },

            // Bottoms
            { category: 'BOTTOM', imageUrl: '/wardrobe-images/blue-jeans-casual.png?v=1765835499778', style: 'Casual', occasion: 'Daily', season: 'All', brand: 'Generic', color: 'Blue' },
            { category: 'BOTTOM', imageUrl: '/wardrobe-images/black-jeans-casual.png?v=1765835499778', style: 'Street', occasion: 'Daily', season: 'All', brand: 'Generic', color: 'Black' },
            { category: 'BOTTOM', imageUrl: '/wardrobe-images/khaki-chinos-casual.png?v=1765835499778', style: 'Casual', occasion: 'Daily', season: 'All', brand: 'Generic', color: 'Khaki' },

            // Shoes
            { category: 'SHOES', imageUrl: '/wardrobe-images/white-sneakers-sport.png?v=1765835499778', style: 'Sport', occasion: 'Active', season: 'All', brand: 'Nike', color: 'White' },
            { category: 'SHOES', imageUrl: '/wardrobe-images/black-sneakers-casual.png?v=1765835499778', style: 'Casual', occasion: 'Daily', season: 'All', brand: 'Generic', color: 'Black' },

            // Outerwear
            { category: 'OUTERWEAR', imageUrl: '/wardrobe-images/black-jacket-urban.png?v=1765835499778', style: 'Urban', occasion: 'Cold', season: 'Winter', brand: 'Generic', color: 'Black' },

            // Accessories
            { category: 'ACCESSORY', imageUrl: '/wardrobe-images/silver-watch-minimal.png?v=1765835499778', style: 'Minimal', occasion: 'Daily', season: 'All', brand: 'Generic', color: 'Silver' },
        ],
        ADULT: [
            // Formal tops
            { category: 'TOP', imageUrl: '/wardrobe-images/white-shirt-formal.png?v=1765835499778', style: 'Formal', occasion: 'Work', season: 'All', brand: 'Generic', color: 'White' },
            { category: 'TOP', imageUrl: '/wardrobe-images/blue-shirt-smart.png?v=1765835499778', style: 'Smart Casual', occasion: 'Work', season: 'All', brand: 'Generic', color: 'Blue' },
            { category: 'TOP', imageUrl: '/wardrobe-images/gray-sweater-casual.png?v=1765835499778', style: 'Casual', occasion: 'Weekend', season: 'All', brand: 'Generic', color: 'Gray' },

            // Formal bottoms
            { category: 'BOTTOM', imageUrl: '/wardrobe-images/navy-pants-formal.png?v=1765835499778', style: 'Formal', occasion: 'Work', season: 'All', brand: 'Generic', color: 'Navy' },
            { category: 'BOTTOM', imageUrl: '/wardrobe-images/gray-pants-smart.png?v=1765835499778', style: 'Smart', occasion: 'Work', season: 'All', brand: 'Generic', color: 'Grey' },

            // Formal shoes
            { category: 'SHOES', imageUrl: '/wardrobe-images/brown-shoes-formal.png?v=1765835499778', style: 'Formal', occasion: 'Work', season: 'All', brand: 'Generic', color: 'Brown' },
            { category: 'SHOES', imageUrl: '/wardrobe-images/black-shoes-formal.png?v=1765835499778', style: 'Classic', occasion: 'Work', season: 'All', brand: 'Generic', color: 'Black' },

            // Outerwear
            { category: 'OUTERWEAR', imageUrl: '/wardrobe-images/navy-jacket-classic.png?v=1765835499778', style: 'Classic', occasion: 'Cold', season: 'Winter', brand: 'Generic', color: 'Navy' },

            // Accessories
            { category: 'ACCESSORY', imageUrl: '/wardrobe-images/gold-watch-luxury.png?v=1765835499778', style: 'Classic', occasion: 'Time', season: 'All', brand: 'Generic', color: 'Gold' },
            { category: 'ACCESSORY', imageUrl: '/wardrobe-images/black-belt-leather.png?v=1765835499778', style: 'Classic', occasion: 'Daily', season: 'All', brand: 'Generic', color: 'Black' },
        ]
    },
    FEMALE: {
        YOUNG: [
            // Tops
            { category: 'TOP', imageUrl: '/wardrobe-images/white-blouse-silk.png?v=1765853955000', style: 'Elegant', occasion: 'Work', season: 'All', brand: 'Generic', color: 'White' },
            { category: 'TOP', imageUrl: '/wardrobe-images/floral-blouse-summer.png?v=1765853955000', style: 'Chic', occasion: 'Casual', season: 'Summer', brand: 'Generic', color: 'Multicolor' },
            { category: 'TOP', imageUrl: '/wardrobe-images/white-tshirt-casual.png?v=1765835499778', style: 'Casual', occasion: 'Daily', season: 'Summer', brand: 'Generic', color: 'White' },

            // Bottoms
            { category: 'BOTTOM', imageUrl: '/wardrobe-images/black-skirt-pencil.png?v=1765853955000', style: 'Professional', occasion: 'Work', season: 'All', brand: 'Generic', color: 'Black' },
            { category: 'BOTTOM', imageUrl: '/wardrobe-images/beige-skirt-midi.png?v=1765853955000', style: 'Boho', occasion: 'Casual', season: 'All', brand: 'Generic', color: 'Beige' },
            { category: 'BOTTOM', imageUrl: '/wardrobe-images/blue-skirt-denim.png?v=1765853955000', style: 'Casual', occasion: 'Daily', season: 'Summer', brand: 'Generic', color: 'Blue' },
            { category: 'BOTTOM', imageUrl: '/wardrobe-images/blue-jeans-casual.png?v=1765835499778', style: 'Casual', occasion: 'Daily', season: 'All', brand: 'Generic', color: 'Blue' },

            // Dresses
            { category: 'DRESS', imageUrl: '/wardrobe-images/floral-dress-summer.png?v=1765853955000', style: 'Romantic', occasion: 'Day', season: 'Summer', brand: 'Generic', color: 'Floral' },
            { category: 'DRESS', imageUrl: '/wardrobe-images/pink-dress-elegant.png?v=1765835499778', style: 'Elegant', occasion: 'Party', season: 'Summer', brand: 'Generic', color: 'Pink' },

            // Shoes
            { category: 'SHOES', imageUrl: '/wardrobe-images/red-heels-stiletto.png?v=1765853955000', style: 'Sexy', occasion: 'Party', season: 'All', brand: 'Generic', color: 'Red' },
            { category: 'SHOES', imageUrl: '/wardrobe-images/black-boots-ankle.png?v=1765853955000', style: 'Edgy', occasion: 'Daily', season: 'Winter', brand: 'Generic', color: 'Black' },
            { category: 'SHOES', imageUrl: '/wardrobe-images/beige-heels-elegant.png?v=1765835499778', style: 'Chic', occasion: 'Daily', season: 'All', brand: 'Generic', color: 'Beige' },

            // Accessories
            { category: 'ACCESSORY', imageUrl: '/wardrobe-images/black-bag-leather.png?v=1765853955000', style: 'Classic', occasion: 'Daily', season: 'All', brand: 'Generic', color: 'Black' },
            { category: 'ACCESSORY', imageUrl: '/wardrobe-images/patterned-scarf-silk.png?v=1765853955000', style: 'Artistic', occasion: 'Daily', season: 'All', brand: 'Generic', color: 'Multicolor' },
            { category: 'ACCESSORY', imageUrl: '/wardrobe-images/gold-watch-luxury.png?v=1765835499778', style: 'Luxury', occasion: 'Party', season: 'All', brand: 'Generic', color: 'Gold' },
        ],
        ADULT: [
            // Professional tops
            { category: 'TOP', imageUrl: '/wardrobe-images/white-shirt-formal.png?v=1765835499778', style: 'Smart', occasion: 'Work', season: 'All', brand: 'Generic', color: 'White' },
            { category: 'TOP', imageUrl: '/wardrobe-images/blue-shirt-smart.png?v=1765835499778', style: 'Professional', occasion: 'Work', season: 'All', brand: 'Generic', color: 'Blue' },
            { category: 'TOP', imageUrl: '/wardrobe-images/gray-sweater-casual.png?v=1765835499778', style: 'Minimal', occasion: 'Daily', season: 'All', brand: 'Generic', color: 'Gray' },

            // Professional bottoms
            { category: 'BOTTOM', imageUrl: '/wardrobe-images/gray-pants-smart.png?v=1765835499778', style: 'Formal', occasion: 'Work', season: 'All', brand: 'Generic', color: 'Grey' },
            { category: 'BOTTOM', imageUrl: '/wardrobe-images/navy-pants-formal.png?v=1765835499778', style: 'Smart', occasion: 'Work', season: 'All', brand: 'Generic', color: 'Navy' },

            // Elegant dresses
            { category: 'DRESS', imageUrl: '/wardrobe-images/navy-dress-professional.png?v=1765835499778', style: 'Elegant', occasion: 'Event', season: 'All', brand: 'Generic', color: 'Navy' },
            { category: 'DRESS', imageUrl: '/wardrobe-images/black-dress-formal.png?v=1765835499778', style: 'Professional', occasion: 'Work', season: 'All', brand: 'Generic', color: 'Black' },

            // Professional shoes
            { category: 'SHOES', imageUrl: '/wardrobe-images/black-shoes-formal.png?v=1765835499778', style: 'Classic', occasion: 'Work', season: 'All', brand: 'Generic', color: 'Black' },
            { category: 'SHOES', imageUrl: '/wardrobe-images/beige-heels-elegant.png?v=1765835499778', style: 'Elegant', occasion: 'Work', season: 'All', brand: 'Generic', color: 'Nude' },

            // Outerwear
            { category: 'OUTERWEAR', imageUrl: '/wardrobe-images/camel-coat-elegant.png?v=1765835499778', style: 'Classic', occasion: 'Cold', season: 'Winter', brand: 'Generic', color: 'Camel' },
            { category: 'OUTERWEAR', imageUrl: '/wardrobe-images/gray-coat-winter.png?v=1765835499778', style: 'Elegant', occasion: 'Cold', season: 'Winter', brand: 'Generic', color: 'Gray' },

            // Accessories
            { category: 'ACCESSORY', imageUrl: '/wardrobe-images/gold-watch-luxury.png?v=1765835499778', style: 'Luxury', occasion: 'Daily', season: 'All', brand: 'Generic', color: 'Gold' },
            { category: 'ACCESSORY', imageUrl: '/wardrobe-images/brown-belt-classic.png?v=1765835499778', style: 'Classic', occasion: 'Daily', season: 'All', brand: 'Generic', color: 'Brown' },
        ]
    }
};
