import NextAuth from "next-auth";
import Discord, { type DiscordProfile } from "next-auth/providers/discord";
import type { JWT } from "next-auth/jwt";
import type { Account, Session } from "next-auth";
import { sql } from "@vercel/postgres";
import { ensureTables } from "@/lib/db";

export const {
  handlers: { GET, POST },
  auth,
} = NextAuth({
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
      if (account?.access_token) token.accessToken = account.access_token as any;
      if (profile?.id) token.discordId = profile.id as any;
      return token;
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      (session as any).accessToken = (token as any)?.accessToken;
      (session as any).discordId = (token as any)?.discordId;
      return session;
    },
  },
  events: {
    // ← вот это главное: сохраняем/обновляем пользователя в таблице users
    async signIn({ account, profile }) {
      const discordId =
        (profile as any)?.id || account?.providerAccountId || null;
      if (!discordId) return;

      const name =
        (profile as any)?.global_name ??
        (profile as any)?.username ??
        null;
      const email = (profile as any)?.email ?? null;

      // аватар Discord (если есть)
      const avatar =
        (profile as any)?.avatar
          ? `https://cdn.discordapp.com/avatars/${discordId}/${(profile as any).avatar}.png`
          : null;

      await ensureTables();

      await sql/*sql*/`
        INSERT INTO users (discord_id, name, email, avatar_url)
        VALUES (${discordId}, ${name}, ${email}, ${avatar})
        ON CONFLICT (discord_id) DO UPDATE
        SET name = EXCLUDED.name,
            email = EXCLUDED.email,
            avatar_url = EXCLUDED.avatar_url,
            last_login_at = now();
      `;
    },
  },
});
