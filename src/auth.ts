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
        // @ts-expect-error - добавляем кастомное поле accessToken в JWT
        token.accessToken = account.access_token;
      }
      // @ts-expect-error - у discord-профиля есть id, кладём в JWT
      if (profile?.id) token.discordId = profile.id as string;
      return token;
    },

    async session({ session, token }) {
      // @ts-expect-error - совместим с расширением Session (next-auth.d.ts)
      session.accessToken = token.accessToken as string | undefined;
      // @ts-expect-error - совместим с расширением Session (next-auth.d.ts)
      session.discordId = token.discordId as string | undefined;
      return session;
    },
  },

  events: {
    async signIn({ profile, account }) {
      // аккуратно вытаскиваем discordId
      const discordId =
        // @ts-expect-error - у discord-профиля есть id
        profile?.id ?? account?.providerAccountId;
      if (!discordId) return;

      // @ts-expect-error - у discord профиля global_name|username
      const name = profile?.global_name ?? profile?.username ?? null;
      // @ts-expect-error - стандартное поле email
      const email = profile?.email ?? null;
      // @ts-expect-error - хэш аватара в discord
      const avatarHash = profile?.avatar ?? null;

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
