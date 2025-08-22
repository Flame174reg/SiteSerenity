// src/auth.ts
import NextAuth, {
  type NextAuthConfig,
  type Profile,
  type User,
} from "next-auth";
import Discord from "next-auth/providers/discord";
import type { JWT } from "next-auth/jwt";
import type { Account, Session } from "next-auth";
import { sql } from "@vercel/postgres";
import { ensureTables } from "@/lib/db";

// Упрощённое описание профиля Discord без any
type DiscordProfileLike = Profile & {
  id?: string;
  avatar?: string | null;
  global_name?: string | null;
  username?: string | null;
  email?: string | null;
};

const authConfig: NextAuthConfig = {
  secret: process.env.AUTH_SECRET,
  providers: [
    Discord({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
      authorization: { params: { scope: "identify email guilds" } },
    }),
  ],
  callbacks: {
    async jwt({
      token,
      user: _user, // не используем, но оставляем в сигнатуре
      account,
      profile,
    }: {
      token: JWT;
      user?: User;
      account?: Account | null;
      profile?: Profile | undefined;
    }) {
      if (account?.access_token) {
        (token as JWT & { accessToken?: string }).accessToken =
          account.access_token;
      }
      const p = profile as DiscordProfileLike | undefined;
      if (p?.id) {
        (token as JWT & { discordId?: string }).discordId = p.id;
      }
      return token;
    },

    async session({ session, token }: { session: Session; token: JWT }) {
      const s = session as Session & {
        accessToken?: string;
        discordId?: string;
      };
      const t = token as JWT & { accessToken?: string; discordId?: string };
      s.accessToken = t.accessToken;
      s.discordId = t.discordId;
      return s;
    },
  },

  events: {
    async signIn({ account, profile }) {
      const p = profile as DiscordProfileLike | undefined;
      const discordId = p?.id ?? account?.providerAccountId ?? null;
      if (!discordId) return;

      const name = p?.global_name ?? p?.username ?? null;
      const email = p?.email ?? null;
      const avatar = p?.avatar
        ? `https://cdn.discordapp.com/avatars/${discordId}/${p.avatar}.png`
        : null;

      await ensureTables();
      await sql/*sql*/`
        INSERT INTO users (discord_id, name, email, avatar_url)
        VALUES (${discordId}, ${name}, ${email}, ${avatar})
        ON CONFLICT (discord_id) DO UPDATE
        SET name = EXCLUDED.name,
            email = EXCLUDED.email,
            avatar_url = EXCLUDED.avatar_url,
            last_login_at = NOW();
      `;
    },
  },
};

const { handlers, auth } = NextAuth(authConfig);

export { auth };
export const { GET, POST } = handlers;
