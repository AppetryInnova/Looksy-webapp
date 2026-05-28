/**
 * Script to update StarterPackData.ts with generated images
 * Run this after generate-wardrobe-images.js completes successfully
 * 
 * Usage: node scripts/update-starter-pack.js
 */

const fs = require('fs');
const path = require('path');

const MANIFEST_PATH = path.join(__dirname, '../public/wardrobe-images/manifest.json');
const STARTER_PACK_PATH = path.join(__dirname, '../src/lib/StarterPackData.ts');

// Read the manifest
const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));

// Filter successful items
const successfulItems = manifest.items.filter(item => item.success);

console.log(`📦 Found ${successfulItems.length} successfully generated images`);

// Create mapping for StarterPackData
const imageMap = {};
const timestamp = Date.now();
successfulItems.forEach(item => {
    imageMap[item.name] = `/wardrobe-images/${item.filename}?v=${timestamp}`;
});

// Generate the new StarterPackData.ts content
const starterPackContent = `export type StarterItem = {
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
            { category: 'TOP', imageUrl: '${imageMap['white-tshirt-casual'] || '/placeholders/tshirt.svg'}', style: 'Casual', occasion: 'Daily', season: 'All', brand: 'Generic', color: 'White' },
            { category: 'TOP', imageUrl: '${imageMap['black-tshirt-streetwear'] || '/placeholders/tshirt.svg'}', style: 'Streetwear', occasion: 'Casual', season: 'All', brand: 'Generic', color: 'Black' },
            { category: 'TOP', imageUrl: '${imageMap['navy-tshirt-casual'] || '/placeholders/tshirt.svg'}', style: 'Casual', occasion: 'Daily', season: 'All', brand: 'Generic', color: 'Navy' },
            
            // Bottoms
            { category: 'BOTTOM', imageUrl: '${imageMap['blue-jeans-casual'] || '/placeholders/jeans.svg'}', style: 'Casual', occasion: 'Daily', season: 'All', brand: 'Generic', color: 'Blue' },
            { category: 'BOTTOM', imageUrl: '${imageMap['black-jeans-casual'] || '/placeholders/jeans.svg'}', style: 'Street', occasion: 'Daily', season: 'All', brand: 'Generic', color: 'Black' },
            { category: 'BOTTOM', imageUrl: '${imageMap['khaki-chinos-casual'] || '/placeholders/jeans.svg'}', style: 'Casual', occasion: 'Daily', season: 'All', brand: 'Generic', color: 'Khaki' },
            
            // Shoes
            { category: 'SHOES', imageUrl: '${imageMap['white-sneakers-sport'] || '/placeholders/sneakers.svg'}', style: 'Sport', occasion: 'Active', season: 'All', brand: 'Nike', color: 'White' },
            { category: 'SHOES', imageUrl: '${imageMap['black-sneakers-casual'] || '/placeholders/sneakers.svg'}', style: 'Casual', occasion: 'Daily', season: 'All', brand: 'Generic', color: 'Black' },
            
            // Outerwear
            { category: 'OUTERWEAR', imageUrl: '${imageMap['black-jacket-urban'] || '/placeholders/jacket.svg'}', style: 'Urban', occasion: 'Cold', season: 'Winter', brand: 'Generic', color: 'Black' },
            
            // Accessories
            { category: 'ACCESSORY', imageUrl: '${imageMap['silver-watch-minimal'] || '/placeholders/watch.svg'}', style: 'Minimal', occasion: 'Daily', season: 'All', brand: 'Generic', color: 'Silver' },
        ],
        ADULT: [
            // Formal tops
            { category: 'TOP', imageUrl: '${imageMap['white-shirt-formal'] || '/placeholders/shirt.svg'}', style: 'Formal', occasion: 'Work', season: 'All', brand: 'Generic', color: 'White' },
            { category: 'TOP', imageUrl: '${imageMap['blue-shirt-smart'] || '/placeholders/shirt.svg'}', style: 'Smart Casual', occasion: 'Work', season: 'All', brand: 'Generic', color: 'Blue' },
            { category: 'TOP', imageUrl: '${imageMap['gray-sweater-casual'] || '/placeholders/tshirt.svg'}', style: 'Casual', occasion: 'Weekend', season: 'All', brand: 'Generic', color: 'Gray' },
            
            // Formal bottoms
            { category: 'BOTTOM', imageUrl: '${imageMap['navy-pants-formal'] || '/placeholders/jeans.svg'}', style: 'Formal', occasion: 'Work', season: 'All', brand: 'Generic', color: 'Navy' },
            { category: 'BOTTOM', imageUrl: '${imageMap['gray-pants-smart'] || '/placeholders/jeans.svg'}', style: 'Smart', occasion: 'Work', season: 'All', brand: 'Generic', color: 'Grey' },
            
            // Formal shoes
            { category: 'SHOES', imageUrl: '${imageMap['brown-shoes-formal'] || '/placeholders/formal-shoes.svg'}', style: 'Formal', occasion: 'Work', season: 'All', brand: 'Generic', color: 'Brown' },
            { category: 'SHOES', imageUrl: '${imageMap['black-shoes-formal'] || '/placeholders/formal-shoes.svg'}', style: 'Classic', occasion: 'Work', season: 'All', brand: 'Generic', color: 'Black' },
            
            // Outerwear
            { category: 'OUTERWEAR', imageUrl: '${imageMap['navy-jacket-classic'] || '/placeholders/jacket.svg'}', style: 'Classic', occasion: 'Cold', season: 'Winter', brand: 'Generic', color: 'Navy' },
            
            // Accessories
            { category: 'ACCESSORY', imageUrl: '${imageMap['gold-watch-luxury'] || '/placeholders/watch.svg'}', style: 'Classic', occasion: 'Time', season: 'All', brand: 'Generic', color: 'Gold' },
            { category: 'ACCESSORY', imageUrl: '${imageMap['black-belt-leather'] || '/placeholders/watch.svg'}', style: 'Classic', occasion: 'Daily', season: 'All', brand: 'Generic', color: 'Black' },
        ]
    },
    FEMALE: {
        YOUNG: [
            // Casual tops
            { category: 'TOP', imageUrl: '${imageMap['white-tshirt-casual'] || '/placeholders/tshirt.svg'}', style: 'Casual', occasion: 'Daily', season: 'Summer', brand: 'Generic', color: 'White' },
            { category: 'TOP', imageUrl: '${imageMap['black-tshirt-streetwear'] || '/placeholders/tshirt.svg'}', style: 'Chic', occasion: 'Daily', season: 'All', brand: 'Generic', color: 'Black' },
            { category: 'TOP', imageUrl: '${imageMap['navy-tshirt-casual'] || '/placeholders/tshirt.svg'}', style: 'Casual', occasion: 'Daily', season: 'All', brand: 'Generic', color: 'Navy' },
            
            // Bottoms
            { category: 'BOTTOM', imageUrl: '${imageMap['blue-jeans-casual'] || '/placeholders/jeans.svg'}', style: 'Casual', occasion: 'Daily', season: 'All', brand: 'Generic', color: 'Blue' },
            { category: 'BOTTOM', imageUrl: '${imageMap['black-jeans-casual'] || '/placeholders/jeans.svg'}', style: 'Fashion', occasion: 'Daily', season: 'All', brand: 'Generic', color: 'Black' },
            
            // Dresses
            { category: 'DRESS', imageUrl: '${imageMap['pink-dress-elegant'] || '/placeholders/dress.svg'}', style: 'Elegant', occasion: 'Party', season: 'Summer', brand: 'Generic', color: 'Pink' },
            { category: 'DRESS', imageUrl: '${imageMap['blue-dress-casual'] || '/placeholders/dress.svg'}', style: 'Casual', occasion: 'Daily', season: 'All', brand: 'Generic', color: 'Blue' },
            
            // Shoes
            { category: 'SHOES', imageUrl: '${imageMap['beige-heels-elegant'] || '/placeholders/sneakers.svg'}', style: 'Chic', occasion: 'Daily', season: 'All', brand: 'Generic', color: 'Beige' },
            { category: 'SHOES', imageUrl: '${imageMap['white-sneakers-sport'] || '/placeholders/sneakers.svg'}', style: 'Sport', occasion: 'Active', season: 'All', brand: 'Generic', color: 'White' },
            
            // Outerwear
            { category: 'OUTERWEAR', imageUrl: '${imageMap['black-jacket-urban'] || '/placeholders/jacket.svg'}', style: 'Warm', occasion: 'Cold', season: 'Winter', brand: 'Generic', color: 'Black' },
            
            // Accessories
            { category: 'ACCESSORY', imageUrl: '${imageMap['gold-watch-luxury'] || '/placeholders/watch.svg'}', style: 'Luxury', occasion: 'Party', season: 'All', brand: 'Generic', color: 'Gold' },
        ],
        ADULT: [
            // Professional tops
            { category: 'TOP', imageUrl: '${imageMap['white-shirt-formal'] || '/placeholders/shirt.svg'}', style: 'Smart', occasion: 'Work', season: 'All', brand: 'Generic', color: 'White' },
            { category: 'TOP', imageUrl: '${imageMap['blue-shirt-smart'] || '/placeholders/shirt.svg'}', style: 'Professional', occasion: 'Work', season: 'All', brand: 'Generic', color: 'Blue' },
            { category: 'TOP', imageUrl: '${imageMap['gray-sweater-casual'] || '/placeholders/tshirt.svg'}', style: 'Minimal', occasion: 'Daily', season: 'All', brand: 'Generic', color: 'Gray' },
            
            // Professional bottoms
            { category: 'BOTTOM', imageUrl: '${imageMap['gray-pants-smart'] || '/placeholders/jeans.svg'}', style: 'Formal', occasion: 'Work', season: 'All', brand: 'Generic', color: 'Grey' },
            { category: 'BOTTOM', imageUrl: '${imageMap['navy-pants-formal'] || '/placeholders/jeans.svg'}', style: 'Smart', occasion: 'Work', season: 'All', brand: 'Generic', color: 'Navy' },
            
            // Elegant dresses
            { category: 'DRESS', imageUrl: '${imageMap['navy-dress-professional'] || '/placeholders/dress.svg'}', style: 'Elegant', occasion: 'Event', season: 'All', brand: 'Generic', color: 'Navy' },
            { category: 'DRESS', imageUrl: '${imageMap['black-dress-formal'] || '/placeholders/dress.svg'}', style: 'Professional', occasion: 'Work', season: 'All', brand: 'Generic', color: 'Black' },
            
            // Professional shoes
            { category: 'SHOES', imageUrl: '${imageMap['black-shoes-formal'] || '/placeholders/formal-shoes.svg'}', style: 'Classic', occasion: 'Work', season: 'All', brand: 'Generic', color: 'Black' },
            { category: 'SHOES', imageUrl: '${imageMap['beige-heels-elegant'] || '/placeholders/formal-shoes.svg'}', style: 'Elegant', occasion: 'Work', season: 'All', brand: 'Generic', color: 'Nude' },
            
            // Outerwear
            { category: 'OUTERWEAR', imageUrl: '${imageMap['camel-coat-elegant'] || '/placeholders/jacket.svg'}', style: 'Classic', occasion: 'Cold', season: 'Winter', brand: 'Generic', color: 'Camel' },
            { category: 'OUTERWEAR', imageUrl: '${imageMap['gray-coat-winter'] || '/placeholders/jacket.svg'}', style: 'Elegant', occasion: 'Cold', season: 'Winter', brand: 'Generic', color: 'Gray' },
            
            // Accessories
            { category: 'ACCESSORY', imageUrl: '${imageMap['gold-watch-luxury'] || '/placeholders/watch.svg'}', style: 'Luxury', occasion: 'Daily', season: 'All', brand: 'Generic', color: 'Gold' },
            { category: 'ACCESSORY', imageUrl: '${imageMap['brown-belt-classic'] || '/placeholders/watch.svg'}', style: 'Classic', occasion: 'Daily', season: 'All', brand: 'Generic', color: 'Brown' },
        ]
    }
};
`;

// Write the updated file
fs.writeFileSync(STARTER_PACK_PATH, starterPackContent);

console.log('✅ StarterPackData.ts updated successfully!');
console.log(`📁 Updated file: ${STARTER_PACK_PATH}`);
console.log(`\n📊 Image mapping:`);
console.log(`   - Generated images: ${Object.keys(imageMap).length}`);
console.log(`   - Fallback to SVG: ${27 - Object.keys(imageMap).length}`);
