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
      authorization: { params: { scope: "identify email" } }, // guilds не обязателен тут
    }),
  ],

  callbacks: {
    // НИЧЕГО не типизируем у параметров — даём lib самой подставить тип
    async jwt({ token, account, profile }) {
      if (account?.access_token) {
        // @ts-expect-error — поля добавлены через module augmentation
        token.accessToken = account.access_token;
      }
      // Discord id
      // @ts-expect-error — profile типизирован либой, поле есть у Discord
      if (profile?.id) token.discordId = profile.id as string;
      return token;
    },

    async session({ session, token }) {
      // @ts-expect-error — поля добавлены через module augmentation
      session.accessToken = token.accessToken as string | undefined;
      // @ts-expect-error — поля добавлены через module augmentation
      session.discordId = token.discordId as string | undefined;
      return session;
    },
  },

  events: {
    // При любом успешном входе — апсертим пользователя в users
    async signIn({ profile, account }) {
      const discordId =
        // @ts-expect-error — у Discord профиля есть id
        profile?.id || account?.providerAccountId;
      if (!discordId) return;

      // Имя
      // @ts-expect-error
      const name = profile?.global_name ?? profile?.username ?? null;
      // @ts-expect-error
      const email = profile?.email ?? null;
      // Аватар
      // @ts-expect-error
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
// Удобно сразу экспортнуть GET/POST — на случай если вы захотите импортировать именно их
export const { GET, POST } = handlers;
