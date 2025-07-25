
import NextAuth from "next-auth"
import GitHub from "next-auth/providers/github"

export const { handlers: { GET, POST }, signIn, signOut, auth } = NextAuth({
  providers: [
    GitHub({
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
      authorization: {
        params: {
          scope: "read:user user:email repo",
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      // Persist the OAuth access_token to the token right after signin
      if (account) {
        token.accessToken = account.access_token;
      }
      return token;
    },
    async session({ session, token }) {
      // Send properties to the client, like an access_token from a provider.
      // The session object is what the client-side useSession hook receives.
      // By default, for security reasons, only a subset of the token is exposed to the client.
      // We need to explicitly pass the accessToken.
      if (session.user) {
        (session as any).accessToken = token.accessToken;
      }
      return session;
    },
  },
})
