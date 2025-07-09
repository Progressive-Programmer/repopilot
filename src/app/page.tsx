
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useSession, signIn, type Session } from "next-auth/react";
import { Github, GitBranch, Loader2, AlertTriangle, Code, ArrowLeft, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { GithubUI } from '@/components/github-ui';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { RepoView } from '@/app/repo-view';
import { Input } from '@/components/ui/input';

export interface Repository {
  id: number;
  name: string;
  full_name: string;
  clone_url: string;
  description: string | null;
  owner: {
    login: string;
  };
  default_branch: string;
}

export interface File {
  name: string;
  path: string;
  type: 'file';
  content: string;
  language: string;
  url: string;
  sha: string;
}

export interface Folder {
  name: string;
  path: string;
  type: 'folder';
  children: FileSystemNode[];
  url: string;
  sha: string;
}

export type FileSystemNode = File | Folder;

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

const RepoDashboard = ({ session, onSelectRepo }: { session: Session | null, onSelectRepo: (repo: Repository) => void }) => {
    const [repos, setRepos] = useState<Repository[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (!session) {
            setLoading(false);
            return;
        }

        async function fetchRepos() {
            setLoading(true);
            setError(null);
            try {
                const res = await fetch('/api/github/user/repos?sort=created&per_page=100');
                if (res.ok) {
                    const data = await res.json();
                    setRepos(data);
                } else {
                    const errorData = await res.json().catch(() => null);
                    setError(errorData?.message || "Failed to fetch repositories.");
                    setRepos([]);
                }
            } catch (error) {
                console.error(error);
                setError("An unexpected network error occurred.");
            } finally {
                setLoading(false);
            }
        }
        fetchRepos();
    }, [session]);
    
    const filteredRepos = repos.filter(repo =>
        repo.name.toLowerCase().includes(searchQuery.toLowerCase())
    );


    if (loading) {
        return (
             <div className="flex flex-col h-svh bg-background">
                <header className="flex items-center justify-between p-4 border-b h-16 shrink-0">
                    <Logo />
                    <GithubUI />
                </header>
                <main className="flex-1 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </main>
            </div>
        )
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
                        placeholder="Search repositories..."
                        className="w-full pl-10"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredRepos.map(repo => (
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
                            <CardFooter>
                                <Button variant="secondary" size="sm" className="w-full" onClick={() => onSelectRepo(repo)}>
                                    <Code className="mr-2 h-4 w-4" />
                                    Explore Code
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
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
    const [selectedRepo, setSelectedRepo] = useState<Repository | null>(null);

    const handleBackToDashboard = useCallback(() => {
        setSelectedRepo(null);
    }, []);

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

    if (selectedRepo) {
        return (
            <div className="flex flex-col h-svh bg-background">
                <header className="flex items-center justify-between px-4 border-b h-16 shrink-0">
                    <div className="flex items-center gap-4">
                        <Button variant="outline" size="sm" onClick={handleBackToDashboard}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back
                        </Button>
                        <div className='hidden md:block'>
                         <Logo />
                        </div>
                    </div>
                    <GithubUI />
                </header>
                <main className="flex-1 overflow-hidden">
                    <RepoView repo={selectedRepo} />
                </main>
            </div>
        );
    }

    return <RepoDashboard session={session} onSelectRepo={setSelectedRepo} />;
}

    
