
import { NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';

async function githubApiProxy(request: Request, path: string) {
    const session = await auth();

    if (!session || !(session as any).accessToken) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const accessToken = (session as any).accessToken;
    
    // For GET requests, forward search params. For others, use the body.
    const searchParams = request.method === 'GET' ? `?${new URL(request.url).searchParams.toString()}` : '';
    const githubApiUrl = `https://api.github.com/${path}${searchParams}`;
    
    const options: RequestInit = {
        method: request.method,
        headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'Accept': 'application/vnd.github.v3+json',
        },
    };

    // Only include body for relevant methods
    if (request.method !== 'GET' && request.method !== 'HEAD') {
        try {
            const body = await request.json();
            options.body = JSON.stringify(body);
        } catch (e) {
            // It's fine if there's no body.
        }
    }

    try {
        const response = await fetch(githubApiUrl, options);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: response.statusText }));
            return NextResponse.json({ message: errorData.message || 'An error occurred with the GitHub API' }, { status: response.status });
        }
        
        const responseText = await response.text();
        if (!responseText) {
            return new NextResponse(null, { status: 204 }); 
        }
        
        const linkHeader = response.headers.get('Link');
        const data = JSON.parse(responseText);

        return NextResponse.json({ data, linkHeader });
        
    } catch (error) {
        console.error('GitHub API proxy error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}


export async function GET(
  request: Request,
  { params }: { params: { path: string[] } }
) {
  return githubApiProxy(request, params.path.join('/'));
}

export async function PUT(
  request: Request,
  { params }: { params: { path: string[] } }
) {
  return githubApiProxy(request, params.path.join('/'));
}
