import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import { OAuth2Client } from 'google-auth-library'
import type { NextAuthOptions } from "next-auth"
import { Session } from "next-auth"

// Extend the Session type
declare module "next-auth" {
  interface Session {
    accessToken?: string;
  }
}

const googleClient = new OAuth2Client({
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
});

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    })
  ],
  callbacks: {
    async signIn({ account, profile }) {
      if (account?.provider === 'google') {
        try {
          const ticket = await googleClient.verifyIdToken({
            idToken: account.id_token!,
            audience: process.env.GOOGLE_CLIENT_ID
          });
          const payload = ticket.getPayload();
          if (!payload) return false;
          
          // 백엔드 연결 시도
          try {
            console.log(process.env.NEXT_PUBLIC_API_URL);
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/google`, {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
              },
              body: JSON.stringify({
                email: payload.email,
                name: payload.name,
                picture: payload.picture,
                sub: payload.sub
              })
            });

            if (!response.ok) {
              console.error('백엔드 응답 에러:', await response.text());
              return false;
            }

            return true;
          } catch (error) {
            console.error('백엔드 연결 에러:', error);
            return true; // 백엔드 연결 실패시에도 로그인은 허용
          }
        } catch (error) {
          console.error('Google 인증 에러:', error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.accessToken) {
        session.accessToken = token.accessToken as string;
      }
      return session;
    }
  },
  pages: {
    signIn: '/login',
    error: '/auth/error',
  },
  secret: process.env.NEXTAUTH_SECRET
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };