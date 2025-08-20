// src/auth.ts
import NextAuth from "next-auth";
import Discord from "next-auth/providers/discord";

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.AUTH_SECRET,
  providers: [
    Discord({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
      authorization: { params: { scope: "identify guilds email" } },
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      // токен доступа от Discord
      if (account && "access_token" in account && typeof account.access_token === "string") {
        // поле расширено в src/types/next-auth.d.ts
        token.accessToken = account.access_token;
      }
      // возьмём Discord ID из providerAccountId (надёжнее, чем profile.id)
      if (account?.providerAccountId) {
        token.discordId = account.providerAccountId;
      }
      return token;
    },

    async session({ session, token }) {
      session.accessToken = token.accessToken as string | undefined;
      session.discordId = token.discordId as string | undefined;
      return session;
    },
  },
});
