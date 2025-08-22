// src/auth.ts
import NextAuth from "next-auth";
import Discord from "next-auth/providers/discord";
import type { JWT } from "next-auth/jwt";
import { upsertUser } from "@/lib/db";

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
    async jwt({ token, account, profile }) {
      // аккуратно добавляем дополнительные поля в токен без any
      const t = token as unknown as Record<string, unknown>;
      if (account?.access_token) {
        t.accessToken = account.access_token;
      }
      // у Discord профиль имеет поле id
      const discordId =
        (profile as unknown as { id?: string } | null | undefined)?.id;
      if (discordId) {
        t.discordId = discordId;
      }
      return token as JWT;
    },

    async session({ session, token }) {
      const t = token as unknown as Record<string, unknown>;
      const s = session as unknown as Record<string, unknown>;

      s.accessToken = (t.accessToken as string | undefined) ?? undefined;
      s.discordId = (t.discordId as string | undefined) ?? undefined;

      // Обновляем/создаём запись пользователя в БД
      const discordId = s.discordId as string | undefined;
      if (discordId) {
        const name = session.user?.name ?? null;
        const avatar =
          (session.user as { image?: string } | undefined)?.image ?? null;
        await upsertUser(discordId, name, avatar);
      }

      return session;
    },
  },
});
