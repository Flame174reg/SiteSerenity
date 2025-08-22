// src/auth.ts
import NextAuth, { type NextAuthConfig } from "next-auth";
import Discord from "next-auth/providers/discord";
import { sql } from "@vercel/postgres";

/** Узкий тайпгард для безопасного доступа к строковым полям */
function getString(obj: unknown, key: string): string | undefined {
  if (obj && typeof obj === "object" && key in obj) {
    const v = (obj as Record<string, unknown>)[key];
    return typeof v === "string" ? v : undefined;
  }
  return undefined;
}

async function tableExists(table: string): Promise<boolean> {
  const { rows } = await sql/*sql*/`
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = ${table}
    LIMIT 1;
  `;
  return rows.length > 0;
}

async function columnExists(table: string, column: string): Promise<boolean> {
  const { rows } = await sql/*sql*/`
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = ${table}
      AND column_name = ${column}
    LIMIT 1;
  `;
  return rows.length > 0;
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
      // Подготавливаем данные
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

      // Если таблицы нет — создадим минимальную (без avatar_url, чтобы не требовать DDL на плате)
      if (!(await tableExists("users"))) {
        await sql/*sql*/`
          CREATE TABLE IF NOT EXISTS users (
            discord_id TEXT PRIMARY KEY,
            name TEXT,
            email TEXT,
            last_login_at TIMESTAMPTZ
          );
        `;
      }

      // Узнаем, есть ли колонка avatar_url; вставляем с нужным набором полей
      const hasAvatar = await columnExists("users", "avatar_url");

      if (hasAvatar) {
        await sql/*sql*/`
          INSERT INTO users (discord_id, name, email, avatar_url, last_login_at)
          VALUES (${pid}, ${name}, ${email}, ${avatar}, NOW())
          ON CONFLICT (discord_id) DO UPDATE
          SET name = EXCLUDED.name,
              email = EXCLUDED.email,
              avatar_url = EXCLUDED.avatar_url,
              last_login_at = NOW();
        `;
      } else {
        await sql/*sql*/`
          INSERT INTO users (discord_id, name, email, last_login_at)
          VALUES (${pid}, ${name}, ${email}, NOW())
          ON CONFLICT (discord_id) DO UPDATE
          SET name = EXCLUDED.name,
              email = EXCLUDED.email,
              last_login_at = NOW();
        `;
      }
    },
  },
} satisfies NextAuthConfig;

const { handlers, auth } = NextAuth(authConfig);
export { auth, handlers };
export const { GET, POST } = handlers;
