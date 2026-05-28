/* eslint-disable @typescript-eslint/no-require-imports */
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

console.log("Checking Environment Variables...");
console.log("DATABASE_URL:", process.env.DATABASE_URL ? "Set" : "MISSING");
console.log("NEXTAUTH_URL:", process.env.NEXTAUTH_URL ? "Set" : "MISSING");
console.log("NEXTAUTH_SECRET:", process.env.NEXTAUTH_SECRET ? "Set" : "MISSING");
console.log("GOOGLE_CLIENT_ID:", process.env.GOOGLE_CLIENT_ID ? "Set" : "MISSING");
console.log("GOOGLE_CLIENT_SECRET:", process.env.GOOGLE_CLIENT_SECRET ? "Set" : "MISSING");

if (process.env.GOOGLE_CLIENT_ID) {
    console.log("Client ID starts with:", process.env.GOOGLE_CLIENT_ID.substring(0, 5) + "...");
}

console.log("\nChecking Database Connection...");
const prisma = new PrismaClient();
async function checkDb() {
    try {
        await prisma.$connect();
        console.log("Database connection successful!");
        const userCount = await prisma.user.count();
        console.log("User count:", userCount);
    } catch (e) {
        console.error("Database connection failed:", e);
    } finally {
        await prisma.$disconnect();
    }
}

checkDb();
