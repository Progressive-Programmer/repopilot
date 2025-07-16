
import { Suspense } from 'react';
import { Github, ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GithubUI } from '@/components/github-ui';
import { RepoHeader } from '@/components/repo-header';
import { RepoView } from '@/components/repo-view';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';

const Logo = () => (
    <div className="flex items-center gap-2">
        <svg width="24" height="24" viewBox="0 0 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-primary">
            <path d="M12 2L2 7V17L12 22L22 17V7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M2 7L12 12L22 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M12 22V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <h1 className="text-lg font-semibold font-headline">RepoPilot</h1>
    </div>
);

const RepoPageSkeleton = () => (
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
            <Skeleton className="w-64 h-8 rounded-md" />
            <GithubUI />
        </header>
        <main className="flex-1 overflow-hidden">
            <div className="flex h-full items-center justify-center">
                <Loader2 className="h-12 w-12 animate-pulse text-muted-foreground" />
            </div>
        </main>
    </div>
);


export default function RepoPage({ params }: { params: { repo: string[] } }) {
    const repoFullName = params.repo.join('/');

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
                <Suspense fallback={<Skeleton className="w-64 h-8 rounded-md" />}>
                   <RepoHeader repoFullName={repoFullName} />
                </Suspense>
                <GithubUI />
            </header>
            <main className="flex-1 overflow-hidden">
                <Suspense fallback={<RepoPageSkeleton />}>
                    <RepoView repoFullName={repoFullName} />
                </Suspense>
            </main>
        </div>
    );
}
