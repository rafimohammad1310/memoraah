import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: {
    signIn: '/admin/login',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnAdmin = nextUrl.pathname.startsWith('/admin');
      
      if (isOnAdmin) {
        if (isLoggedIn && auth.user?.role === 'admin') return true;
        return false; // Redirect unauthenticated users to login page
      }
      return true;
    },
    session({ session, token }) {
      if (token.role) {
        session.user.role = token.role;
      }
      return session;
    },
    jwt({ token, user }) {
      if (user) {
        token.role = user.role;
      }
      return token;
    }
  },
  providers: [], // Add your providers here
} satisfies NextAuthConfig;