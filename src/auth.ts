// src/auth.ts
import NextAuth from "next-auth";
import Discord, { type DiscordProfile } from "next-auth/providers/discord";
import type { JWT } from "next-auth/jwt";
import type { Account, Session, Profile } from "next-auth";
import { sql } from "@vercel/postgres";
import { ensureTables } from "@/lib/db";

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
    }: {
      token: JWT;
      account?: Account | null;
      profile?: Profile | null;
    }) {
      // access_token от Discord (если есть)
      if (account?.access_token) {
        token.accessToken = account.access_token;
      }

      // Discord id из профиля (без any — через безопасное сужение типа)
      if (profile && "id" in profile && typeof (profile as { id?: unknown }).id === "string") {
        token.discordId = (profile as { id: string }).id;
      }

      return token;
    },

    async session({ session, token }: { session: Session; token: JWT }) {
      session.accessToken = token.accessToken;
      session.discordId = token.discordId;
      return session;
    },
  },

  events: {
    // Сохраняем/обновляем пользователя при авторизации
    async signIn({
      account,
      profile,
    }: {
      account?: Account | null;
      profile?: Profile | null;
    }) {
      const discordId: string | null =
        (profile && "id" in profile && typeof (profile as { id?: unknown }).id === "string"
          ? (profile as { id: string }).id
          : account?.providerAccountId) ?? null;

      if (!discordId) return;

      const name: string | null =
        (profile && "global_name" in profile && typeof (profile as { global_name?: unknown }).global_name === "string"
          ? (profile as { global_name?: string }).global_name
          : undefined) ??
        (profile && "username" in profile && typeof (profile as { username?: unknown }).username === "string"
          ? (profile as { username?: string }).username
          : undefined) ??
        null;

      const email: string | null =
        profile && "email" in profile && typeof (profile as { email?: unknown }).email === "string"
          ? ((profile as { email?: string }).email ?? null)
          : null;

      let avatar: string | null = null;
      if (
        discordId &&
        profile &&
        "avatar" in profile &&
        typeof (profile as { avatar?: unknown }).avatar === "string" &&
        (profile as { avatar?: string | null }).avatar
      ) {
        const hash = (profile as DiscordProfile).avatar as string;
        avatar = `https://cdn.discordapp.com/avatars/${discordId}/${hash}.png`;
      }

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
export const { GET, POST } = handlers;
