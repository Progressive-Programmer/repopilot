
"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSession, signIn, type Session } from "next-auth/react";
import { useRouter } from 'next/navigation';
import { Github, GitBranch, Loader2, AlertTriangle, Code, Search, Star, GitFork, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { GithubUI } from '@/components/github-ui';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import type { Repository } from '@/lib/types';


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

const UnauthenticatedView = () => (
    <div className="flex flex-col items-center justify-center h-svh bg-background">
        <Card className="w-full max-w-md shadow-2xl">
            <CardHeader className="text-center">
                <CardTitle className="text-2xl">Welcome to RepoPilot</CardTitle>
                <CardDescription>Sign in with your GitHub account to get started.</CardDescription>
            </CardHeader>
            <CardContent>
                <Button className="w-full" onClick={() => signIn('github')}>
                    <Github className="mr-2 h-5 w-5" />
                    Sign in with GitHub
                </Button>
            </CardContent>
        </Card>
    </div>
);

const RepoDashboardSkeleton = () => (
    <div className="flex flex-col h-svh bg-background">
        <header className="flex items-center justify-between p-4 border-b h-16 shrink-0">
            <Logo />
            <GithubUI />
        </header>
        <main className="flex-1 overflow-auto p-4 md:p-8">
            <div className="max-w-4xl mx-auto">
                <Skeleton className="h-10 w-1/3 mb-4" />
                <Skeleton className="h-12 w-full mb-6" />
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {[...Array(6)].map((_, i) => (
                        <Card key={i}>
                            <CardHeader>
                                <Skeleton className="h-6 w-3/4 mb-2" />
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-5/6" />
                            </CardHeader>
                            <CardContent>
                                <Skeleton className="h-4 w-1/2" />
                            </CardContent>
                            <CardFooter>
                                <Skeleton className="h-9 w-full" />
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            </div>
        </main>
    </div>
);


const RepoDashboard = ({ session }: { session: Session | null }) => {
    const router = useRouter();
    const [allRepos, setAllRepos] = useState<Repository[]>([]);
    const [filteredRepos, setFilteredRepos] = useState<Repository[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [loadingRepo, setLoadingRepo] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const sentinelRef = useRef<HTMLDivElement | null>(null);
    const isInitialLoad = useRef(true);

    const handleSelectRepo = useCallback((repo: Repository) => {
        setLoadingRepo(repo.full_name);
        router.push(`/view/${repo.full_name}`);
    }, [router]);

    const fetchAllRepos = useCallback(async (pageNum = 1): Promise<Repository[]> => {
        const res = await fetch(`/api/github/user/repos?sort=pushed&per_page=100&page=${pageNum}`);
        if (!res.ok) {
            const errorData = await res.json().catch(() => null);
            throw new Error(errorData?.message || `Failed to fetch repositories. Status: ${res.status}`);
        }
        const { data, linkHeader } = await res.json();
        if (!Array.isArray(data)) {
            throw new Error("Invalid data format received from API.");
        }
        const hasNextPage = linkHeader?.includes('rel="next"');
        if (hasNextPage) {
            return data.concat(await fetchAllRepos(pageNum + 1));
        }
        return data;
    }, []);

    const filterRepos = useCallback(() => {
        if (!searchQuery) {
            setFilteredRepos(allRepos);
            return;
        }
        const lowercasedQuery = searchQuery.toLowerCase();
        const results = allRepos.filter(repo =>
            repo.name.toLowerCase().includes(lowercasedQuery)
        );
        setFilteredRepos(results);
    }, [allRepos, searchQuery]);


    useEffect(() => {
        const loadInitialData = async () => {
            if (!session) return;
            setLoading(true);
            setError(null);
            try {
                const repos = await fetchAllRepos();
                setAllRepos(repos);
                setFilteredRepos(repos);
            } catch (error: any) {
                console.error(error);
                setError(error.message || "An unexpected network error occurred.");
                setAllRepos([]);
                setFilteredRepos([]);
            } finally {
                setLoading(false);
                isInitialLoad.current = false;
            }
        };
        loadInitialData();
    }, [session, fetchAllRepos]);
    
     useEffect(() => {
        // Debounce search filtering
        const handler = setTimeout(() => {
            filterRepos();
        }, 200);

        return () => {
            clearTimeout(handler);
        };
    }, [searchQuery, filterRepos]);


    if (isInitialLoad.current) {
        return <RepoDashboardSkeleton />;
    }

    return (
    <div className="flex flex-col h-svh bg-background">
        <header className="flex items-center justify-between p-4 border-b h-16 shrink-0">
            <Logo />
            <GithubUI />
        </header>
        <main className="flex-1 overflow-auto p-4 md:p-8">
            <div className="max-w-4xl mx-auto">
                 {error && (
                    <Alert variant="destructive" className="mb-6">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}
                <h2 className="text-2xl font-bold tracking-tight mb-4">Select a Repository</h2>
                 <div className="relative mb-6">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Search your repositories..."
                        className="w-full pl-10"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredRepos.map(repo => {
                        const isRepoLoading = loadingRepo === repo.full_name;
                        return (
                            <Card key={repo.id} className="flex flex-col">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-xl">
                                        <GitBranch className="h-5 w-5" />
                                        {repo.name}
                                    </CardTitle>
                                    <CardDescription className="flex-grow h-12 overflow-hidden text-ellipsis">
                                        {repo.description || "No description."}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="text-xs text-muted-foreground flex items-center gap-4">
                                    <div className="flex items-center gap-1">
                                        <Star className="h-3 w-3" /> {repo.stargazers_count}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <GitFork className="h-3 w-3" /> {repo.forks_count}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Eye className="h-3 w-3" /> {repo.watchers_count}
                                    </div>

                                </CardContent>
                                <CardFooter>
                                    <Button variant="secondary" size="sm" className="w-full" onClick={() => handleSelectRepo(repo)} disabled={isRepoLoading}>
                                        {isRepoLoading ? (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        ) : (
                                            <Code className="mr-2 h-4 w-4" />
                                        )}
                                        Explore Code
                                    </Button>
                                </CardFooter>
                            </Card>
                        )
                    })}
                </div>

                {!error && filteredRepos.length === 0 && !loading && (
                    <div className="py-16 text-center text-muted-foreground">
                        {searchQuery ? (
                            <p>No repositories found for "{searchQuery}".</p>
                        ) : (
                            <>
                                <p>No repositories found.</p>
                                <p className="text-sm">Make sure you have granted access to your repositories.</p>
                            </>
                        )}
                    </div>
                )}
            </div>
        </main>
    </div>
    );
};


export default function Home() {
    const { data: session, status } = useSession();
    
    if (status === "loading") {
        return (
             <div className="flex items-center justify-center h-svh bg-background">
                <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
            </div>
        );
    }
    
    if (status === "unauthenticated" || !session) {
        return <UnauthenticatedView />;
    }

    return <RepoDashboard session={session} />;
}
