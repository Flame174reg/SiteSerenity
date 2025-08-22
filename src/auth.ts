// src/auth.ts
import NextAuth, { type NextAuthConfig } from "next-auth";
import Discord from "next-auth/providers/discord";
import { sql } from "@vercel/postgres";

function getString(obj: unknown, key: string): string | undefined {
  if (obj && typeof obj === "object" && key in obj) {
    const v = (obj as Record<string, unknown>)[key];
    return typeof v === "string" ? v : undefined;
  }
  return undefined;
}

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
      const access = getString(account as unknown, "access_token");
      if (access) token.accessToken = access;

      const pid = getString(profile as unknown, "id");
      if (pid) token.discordId = pid;

      return token;
    },

    async session({ session, token }) {
      const access = getString(token as unknown, "accessToken");
      const did = getString(token as unknown, "discordId");

      session.accessToken = access ?? undefined;
      if (did) {
        session.discordId = did;
        if (session.user) session.user.id = did;
      }
      return session;
    },
  },

  events: {
    async signIn({ profile, account }) {
      const pid =
        getString(profile as unknown, "id") ??
        getString(account as unknown, "providerAccountId");
      if (!pid) return;

      const name =
        getString(profile as unknown, "global_name") ??
        getString(profile as unknown, "username") ??
        null;

      const email = getString(profile as unknown, "email") ?? null;
      const avatarHash = getString(profile as unknown, "avatar") ?? null;

      const avatar = avatarHash
        ? `https://cdn.discordapp.com/avatars/${pid}/${avatarHash}.png`
        : null;

      // На входе пользователя убедимся, что таблицы есть и запишем пользователя
      await sql/*sql*/`
        CREATE TABLE IF NOT EXISTS users (
          discord_id TEXT PRIMARY KEY,
          name TEXT,
          email TEXT,
          avatar_url TEXT,
          last_login_at TIMESTAMPTZ
        );
      `;
      await sql/*sql*/`
        INSERT INTO users (discord_id, name, email, avatar_url, last_login_at)
        VALUES (${pid}, ${name}, ${email}, ${avatar}, NOW())
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
