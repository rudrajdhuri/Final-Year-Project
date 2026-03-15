import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId:     process.env.GOOGLE_CLIENT_ID     ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
  ],

  callbacks: {
    async jwt({ token, user, account }) {
      if (account?.provider === "google" && user) {
        token.googleSub = account.providerAccountId;
        token.picture   = user.image;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).sub     = token.googleSub || token.sub;
        (session.user as any).picture = token.picture;
      }
      return session;
    },
  },

  // After Google login, redirect to our callback handler page
  pages: {
    signIn:   "/login",
    error:    "/login",
    // After successful Google auth → go to our callback page
    newUser:  "/auth/google-callback",
  },

  secret: process.env.NEXTAUTH_SECRET ?? "agribot-fallback-secret",
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };