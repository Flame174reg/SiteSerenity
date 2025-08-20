import NextAuth from "next-auth";
import Discord from "next-auth/providers/discord";

export const { handlers: { GET, POST } } = NextAuth({
  secret: process.env.AUTH_SECRET,
  providers: [
    Discord({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
      authorization: { params: { scope: "identify guilds email" } },
    }),
  ],
});
