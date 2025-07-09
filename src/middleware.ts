import NextAuth from 'next-auth';
import { auth } from '@/app/api/auth/[...nextauth]/route';

const { handlers } = NextAuth(auth);

export const middleware = auth;

export const config = {
  matcher: ['/api/github/:path*'],
};
