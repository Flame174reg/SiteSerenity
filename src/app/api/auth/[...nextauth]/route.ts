import NextAuth from "next-auth";
import Discord from "next-auth/providers/discord";

const { handlers, auth } = NextAuth({
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
      // account.access_token присутствует в типах Account (опционально)
      if (account?.access_token) {
        token.accessToken = account.access_token;
      }
      // В OAuth-профиле id может быть без жёсткого типа — проверяем и пишем в JWT
      const pid = (profile as any)?.id;
      if (typeof pid === "string") token.discordId = pid;

      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string | undefined;
      session.discordId = token.discordId as string | undefined;
      return session;
    },
  },
});

// Важно: именно так экспортируем GET/POST, иначе роут не поднимется
export const { GET, POST } = handlers;
export { auth };
