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

async function tableExists(table: string): Promise<boolean> {
  const { rows } = await sql/*sql*/`
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = ${table}
    LIMIT 1;
  `;
  return rows.length > 0;
}

async function getExistingColumns(table: string): Promise<Set<string>> {
  const { rows } = await sql/*sql*/`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = ${table};
  `;
  return new Set(rows.map((r) => String(r.column_name)));
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
      // 1) ID и данные из профиля
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

      // 2) Минимальная таблица если нет
      if (!(await tableExists("users"))) {
        await sql/*sql*/`
          CREATE TABLE IF NOT EXISTS users (
            discord_id TEXT PRIMARY KEY,
            name TEXT,
            last_login_at TIMESTAMPTZ
          );
        `;
      }

      // 3) Динамический UPSERT по существующим колонкам
      const cols = await getExistingColumns("users");
      const fields: string[] = ["discord_id"];
      const values: string[] = [`'${pid.replace(/'/g, "''")}'`];

      if (cols.has("name")) {
        fields.push("name");
        values.push(name === null ? "NULL" : `'${name.replace(/'/g, "''")}'`);
      }
      if (cols.has("email")) {
        fields.push("email");
        values.push(email === null ? "NULL" : `'${email.replace(/'/g, "''")}'`);
      }
      if (cols.has("avatar_url")) {
        fields.push("avatar_url");
        values.push(avatar === null ? "NULL" : `'${avatar.replace(/'/g, "''")}'`);
      }
      if (cols.has("last_login_at")) {
        fields.push("last_login_at");
        values.push("NOW()");
      }

      const setUpdates = fields
        .filter((f) => f !== "discord_id")
        .map((f) => `${f} = EXCLUDED.${f}`)
        .join(", ");

      const query = `
        INSERT INTO users (${fields.join(", ")})
        VALUES (${values.join(", ")})
        ON CONFLICT (discord_id) DO UPDATE SET ${setUpdates};
      `;

      await sql.query(query);
    },
  },
} satisfies NextAuthConfig;

const { handlers, auth } = NextAuth(authConfig);
export { auth, handlers };
export const { GET, POST } = handlers;
