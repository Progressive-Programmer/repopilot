
import { NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';

export async function GET(
  request: Request,
  { params }: { params: { path: string[] } }
) {
  const session = await auth();

  if (!session || !(session as any).accessToken) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const accessToken = (session as any).accessToken;
  const path = params.path.join('/');
  
  // Forward search params from the incoming request to the GitHub API
  const { searchParams } = new URL(request.url);
  const githubApiUrl = `https://api.github.com/${path}?${searchParams.toString()}`;
  
  try {
    const response = await fetch(githubApiUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: response.statusText }));
      return NextResponse.json({ message: errorData.message || 'An error occurred with the GitHub API' }, { status: response.status });
    }
    
    // Handle cases where response might be empty (e.g., 204 No Content)
    const responseText = await response.text();
    if (!responseText) {
        return new NextResponse(null, { status: 204 }); 
    }
    
    // Extract the Link header for pagination
    const linkHeader = response.headers.get('Link');

    const data = JSON.parse(responseText);

    // Return both data and pagination info
    return NextResponse.json({ data, linkHeader });
    
  } catch (error) {
    console.error('GitHub API proxy error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
