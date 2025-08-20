import NextAuth from "next-auth";
import Discord from "next-auth/providers/discord";

export const {
  handlers: { GET, POST },
  auth,          // <- пригодится для защиты страниц
} = NextAuth({
  secret: process.env.AUTH_SECRET,
  providers: [
    Discord({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
      // у нас уже есть нужные скоупы, оставим:
      authorization: { params: { scope: "identify guilds email" } },
    }),
  ],
  // Пробрасываем access_token в JWT и сессию
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account) {
        // access_token от Discord
        // @ts-ignore
        token.accessToken = account.access_token;
      }
      // Пробросим discord id
      // @ts-ignore
      if (profile?.id) token.discordId = profile.id as string;
      return token;
    },
    async session({ session, token }) {
      // @ts-ignore
      session.accessToken = token.accessToken as string | undefined;
      // @ts-ignore
      session.discordId = token.discordId as string | undefined;
      return session;
    },
  },
});
