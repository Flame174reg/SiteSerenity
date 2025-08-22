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
      // access_token с OAuth-аккаунта → в JWT
      if (account?.access_token) {
        token.accessToken = String(account.access_token);
      }

      // Безопасно достаем discord id из профиля
      const anyProfile = profile as Record<string, unknown> | null | undefined;
      const pId =
        anyProfile && typeof anyProfile.id === "string" ? anyProfile.id : undefined;
      if (pId) token.discordId = pId;

      return token;
    },

    async session({ session, token }) {
      if (token.accessToken) session.accessToken = token.accessToken;
      if (typeof token.discordId === "string") {
        session.discordId = token.discordId;          // если используешь отдельно
        if (session.user) session.user.id = token.discordId; // дублируем в user.id
      }
      return session;
    },
  },

  events: {
    async signIn({ profile, account }) {
      // Аккуратно вытаскиваем значения из profile/account
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
