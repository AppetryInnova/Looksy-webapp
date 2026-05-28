import GoogleProvider from "next-auth/providers/google";
import FacebookProvider from "next-auth/providers/facebook";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { NextAuthOptions } from "next-auth";
import { sendWelcomeEmail } from "./email";

export const authOptions: NextAuthOptions = {
    adapter: PrismaAdapter(prisma),
    session: {
        strategy: "jwt"
    },
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID || "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
        }),
        FacebookProvider({
            clientId: process.env.FACEBOOK_ID || "",
            clientSecret: process.env.FACEBOOK_SECRET || "",
        }),
        CredentialsProvider({
            name: "Test Login",
            credentials: {
                username: { label: "Username", type: "text", placeholder: "test" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                let username = credentials?.username || "testuser";
                let email = `${username}@example.com`;

                // Handle special test users to match database exactly if needed
                if (username === 'business_user') {
                    email = 'business_user@example.com';
                } else if (username === 'influencer_user') {
                    email = 'influencer_user@example.com';
                }

                const user = await prisma.user.upsert({
                    where: { email },
                    update: {},
                    create: {
                        email,
                        name: username,
                        username: username,
                        image: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
                        onboardingCompleted: true
                    }
                });

                // Convert null to undefined for NextAuth compatibility
                return {
                    ...user,
                    username: user.username ?? undefined,
                };
            }
        })
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.username = user.username;
            }
            return token;
        },
        async session({ session, token }) {
            if (session?.user) {
                session.user.id = token.id as string;
                session.user.username = token.username;
            }
            return session;
        }
    },
    events: {
        async createUser({ user }) {
            if (user.email && user.name) {
                await sendWelcomeEmail(user.email, user.name);
            }
        }
    },
    debug: false
};
