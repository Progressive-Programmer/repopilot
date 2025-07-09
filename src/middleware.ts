
import {NextRequest, NextResponse} from 'next/server';

const GITHUB_API_URL = 'https://api.github.com';

export async function middleware(request: NextRequest) {
  // We need to get the access token to be able to make API requests to GitHub
  // The official way to do this is to use `auth()` from `next-auth`, but that
  // doesn't work in middleware yet.
  // See: https://github.com/nextauthjs/next-auth/issues/9633
  const cookieName =
    process.env.NODE_ENV === 'development'
      ? 'next-auth.session-token'
      : '__Secure-next-auth.session-token';
  const sessionToken = request.cookies.get(cookieName)?.value;

  if (!sessionToken) {
    return NextResponse.json({message: 'Not authenticated'}, {status: 401});
  }

  // To get the GitHub access token, we have to call the /session endpoint
  // that's built into next-auth.
  const sessionRes = await fetch(
    new URL('/api/auth/session', request.nextUrl.origin),
    {
      headers: {
        cookie: `${cookieName}=${sessionToken}`,
      },
    },
  );

  if (!sessionRes.ok) {
    return NextResponse.json({message: 'Not authenticated'}, {status: 401});
  }
  const session = await sessionRes.json();
  const accessToken = session.accessToken;

  if (!accessToken) {
    return NextResponse.json({message: 'Not authenticated'}, {status: 401});
  }

  // Now that we have the access token, we can proxy requests to the GitHub API.
  const url = new URL(request.url);
  const path = url.pathname.replace('/api/github', '');

  const githubResponse = await fetch(`${GITHUB_API_URL}${path}`, {
    headers: {
      Authorization: `token ${accessToken}`,
      'Content-Type': 'application/json',
      Accept: 'application/vnd.github.v3+json',
    },
  });

  const data = await githubResponse.json();

  return NextResponse.json(data, {status: githubResponse.status});
}

// We only want to run this middleware on requests to /api/github/*
export const config = {
  matcher: '/api/github/:path*',
};
