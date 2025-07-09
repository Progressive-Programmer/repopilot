
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
    }
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
  const path = url.pathname.replace(/^\/api\/github/, '');

  try {
    const githubResponse = await fetch(`${GITHUB_API_URL}${path}`, {
      headers: {
        Authorization: `token ${accessToken}`,
        'Content-Type': 'application/json',
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (!githubResponse.ok) {
        return NextResponse.json(
            { message: `GitHub API error: ${githubResponse.statusText}` },
            { status: githubResponse.status }
        );
    }

    const contentType = githubResponse.headers.get("content-type");
    if (contentType && contentType.indexOf("application/json") !== -1) {
      const data = await githubResponse.json();
      return NextResponse.json(data, {status: githubResponse.status});
    } else {
      // If the response is not JSON, we cannot parse it as such.
      // We can either return an error or an empty object.
      // Returning an empty array for list-like endpoints, or empty object for others
      // might be a safe default to avoid client-side errors.
      return NextResponse.json([], {status: githubResponse.status});
    }

  } catch (error) {
    console.error('Middleware error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

// We only want to run this middleware on requests to /api/github/*
export const config = {
  matcher: '/api/github/:path*',
};
