import NextAuth, { DefaultSession, DefaultUser } from "next-auth"
import { JWT, DefaultJWT } from "next-auth/jwt"

declare module "next-auth" {
    /**
     * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
     */
    interface Session {
        user: {
            id: string
            username?: string
            stylePoints?: number
            level?: string
        } & DefaultSession["user"]
    }

    interface User extends DefaultUser {
        id: string
        username?: string
    }
}

declare module "next-auth/jwt" {
    interface JWT extends DefaultJWT {
        id: string
        username?: string
    }
}
