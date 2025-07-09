
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
  
  try {
    const response = await fetch(`https://api.github.com/${path}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: response.statusText }));
      return NextResponse.json({ message: errorData.message || 'An error occurred with the GitHub API' }, { status: response.status });
    }
    
    // Handle cases where response might be empty
    const responseText = await response.text();
    if (!responseText) {
        return new NextResponse(null, { status: 204 }); // No Content
    }

    const data = JSON.parse(responseText);
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('GitHub API proxy error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
