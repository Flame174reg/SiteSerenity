// src/auth.ts
import NextAuth, { type NextAuthConfig } from "next-auth";
import Discord from "next-auth/providers/discord";
import { ensureTables } from "@/lib/db";
import { sql } from "@vercel/postgres";

const authConfig = {
  secret: process.env.AUTH_SECRET,
  providers: [
    Discord({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
      authorization: { params: { scope: "identify email" } },
    }),
  ],

  callbacks: {
    async jwt({ token, account, profile }) {
      if (account?.access_token) {
        token.accessToken = String(account.access_token);
      }

      const p = profile as Record<string, unknown> | null | undefined;
      const pid = p && typeof p.id === "string" ? p.id : undefined;
      if (pid) token.discordId = pid;

      return token;
    },

    async session({ session, token }) {
      // КРИТИЧЕСКАЯ ПРАВКА: нормализуем тип accessToken
      session.accessToken =
        typeof (token as any).accessToken === "string"
          ? ((token as any).accessToken as string)
          : undefined;

      if (typeof (token as any).discordId === "string") {
        const did = (token as any).discordId as string;
        session.discordId = did;
        if (session.user) session.user.id = did;
      }
      return session;
    },
  },

  events: {
    async signIn({ profile, account }) {
      const p = profile as Record<string, unknown> | null | undefined;

      const discordId =
        (p && typeof p.id === "string" ? p.id : undefined) ??
        (account && typeof account.providerAccountId === "string"
          ? account.providerAccountId
          : undefined);

      if (!discordId) return;

      const name =
        (p && typeof p.global_name === "string" ? p.global_name : undefined) ??
        (p && typeof p.username === "string" ? p.username : undefined) ??
        null;

      const email =
        (p && typeof p.email === "string" ? p.email : undefined) ?? null;

      const avatarHash =
        (p && typeof p.avatar === "string" ? p.avatar : undefined) ?? null;

      const avatar = avatarHash
        ? `https://cdn.discordapp.com/avatars/${discordId}/${avatarHash}.png`
        : null;

      await ensureTables();
      await sql/*sql*/`
        INSERT INTO users (discord_id, name, email, avatar_url, last_login_at)
        VALUES (${discordId}, ${name}, ${email}, ${avatar}, NOW())
        ON CONFLICT (discord_id) DO UPDATE
        SET name = EXCLUDED.name,
            email = EXCLUDED.email,
            avatar_url = EXCLUDED.avatar_url,
            last_login_at = NOW();
      `;
    },
  },
} satisfies NextAuthConfig;

const { handlers, auth } = NextAuth(authConfig);
export { auth, handlers };
export const { GET, POST } = handlers;
