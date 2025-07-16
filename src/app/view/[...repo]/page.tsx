
import { Suspense } from 'react';
import { Github, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GithubUI } from '@/components/github-ui';
import { RepoHeader } from '@/components/repo-header';
import { RepoView } from '@/components/repo-view';
import type { Repository } from '@/lib/types';
import Link from 'next/link';

const Logo = () => (
    <div className="flex items-center gap-2">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-primary">
            <path d="M12 2L2 7V17L12 22L22 17V7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M2 7L12 12L22 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M12 22V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <h1 className="text-lg font-semibold font-headline">RepoPilot</h1>
    </div>
);


async function fetchRepoDetails(repoFullName: string): Promise<Repository | null> {
    try {
        // We can't use the relative /api/github proxy here because this is a server component
        // and fetch needs a full URL. We'll assume for now this runs on the server where
        // we might have direct access or need to configure differently for production.
        // For simplicity in development, this will call the GitHub API directly.
        // In a real app, this should use authentication.
        const res = await fetch(`https://api.github.com/repos/${repoFullName}`);
        if (!res.ok) {
            console.error(`Failed to fetch repository details for ${repoFullName}. Status: ${res.status}`);
            return null;
        }
        return await res.json();
    } catch (error) {
        console.error("Failed to fetch full repo details", error);
        return null;
    }
}


// This is the main Server Component for the repository view page.
export default async function RepoPage({ params }: { params: { repo: string[] } }) {
    const repoFullName = params.repo.join('/');
    const repoDetails = await fetchRepoDetails(repoFullName);

    return (
        <div className="flex flex-col h-svh bg-background">
            <header className="flex items-center justify-between px-4 border-b h-16 shrink-0">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="sm" asChild>
                       <Link href="/">
                         <ArrowLeft className="mr-2 h-4 w-4" />
                         Back
                       </Link>
                    </Button>
                    <div className='hidden md:block'>
                        <Logo />
                    </div>
                </div>
                {repoDetails ? <RepoHeader repo={repoDetails} /> : <div className="w-64 h-8 rounded-md bg-muted animate-pulse" />}
                <GithubUI />
            </header>
            <main className="flex-1 overflow-hidden">
                {repoDetails ? (
                    <Suspense fallback={<div className="flex h-full items-center justify-center"><Github className="h-12 w-12 animate-pulse text-muted-foreground" /></div>}>
                        <RepoView repo={repoDetails} />
                    </Suspense>
                ) : (
                    <div className="flex items-center justify-center h-full text-red-500">
                        Repository not found or failed to load.
                    </div>
                )}
            </main>
        </div>
    );
}
