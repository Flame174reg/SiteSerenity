// src/auth.ts
import NextAuth from "next-auth";
import Discord, { type DiscordProfile } from "next-auth/providers/discord";
import type { JWT } from "next-auth/jwt";
import type { Account, Session } from "next-auth";
import { sql } from "@vercel/postgres";
import { ensureTables } from "@/lib/db";
import { isSuperAdmin } from "@/lib/access"; // если нет — просто удалите эту строку и использование

const authConfig = {
  secret: process.env.AUTH_SECRET,
  providers: [
    Discord({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
      authorization: { params: { scope: "identify guilds email" } },
    }),
  ],
  callbacks: {
    async jwt({
      token,
      account,
      profile,
    }: { token: JWT; account?: Account | null; profile?: DiscordProfile | null }) {
      if (account?.access_token) (token as any).accessToken = account.access_token;
      if (profile?.id) (token as any).discordId = profile.id;
      return token;
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      (session as any).accessToken = (token as any)?.accessToken;
      (session as any).discordId = (token as any)?.discordId;
      return session;
    },
  },
  events: {
    async signIn({ account, profile }: { account?: Account | null; profile?: DiscordProfile | null }) {
      const discordId = profile?.id || account?.providerAccountId || null;
      if (!discordId) return;

      const name = (profile as any)?.global_name ?? (profile as any)?.username ?? null;
      const email = (profile as any)?.email ?? null;
      const avatar = (profile as any)?.avatar
        ? `https://cdn.discordapp.com/avatars/${discordId}/${(profile as any).avatar}.png`
        : null;

      await ensureTables();

      await sql/*sql*/`
        INSERT INTO users (discord_id, name, email, avatar, last_login_at)
        VALUES (${discordId}, ${name}, ${email}, ${avatar}, now())
        ON CONFLICT (discord_id) DO UPDATE
        SET name = EXCLUDED.name,
            email = EXCLUDED.email,
            avatar = EXCLUDED.avatar,
            last_login_at = now();
      `;
    },
  },
} as const;

const { handlers, auth } = NextAuth(authConfig);

export { auth };
// Экспортируем GET/POST, чтобы их можно было пробросить из route.ts
export const GET = handlers.GET;
export const POST = handlers.POST;
