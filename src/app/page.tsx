
"use client";

import { useState, useEffect } from 'react';
import { useSession, signIn, type Session } from "next-auth/react";
import { Github, GitBranch, Loader2, AlertTriangle, Code } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { GithubUI } from '@/components/github-ui';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export interface Repository {
  id: number;
  name: string;
  full_name: string;
  clone_url: string;
  description: string | null;
  owner: {
    login: string;
  };
}

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
        <Card className="w-full max-w-md">
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

const RepoDashboard = ({ session }: { session: Session | null }) => {
    const [repos, setRepos] = useState<Repository[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!session) {
            setLoading(false);
            return;
        }

        async function fetchRepos() {
            setLoading(true);
            setError(null);
            try {
                const res = await fetch('/api/github/user/repos?sort=pushed');
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

    const handleOpenInVSCode = (repo: Repository) => {
        window.location.href = `vscode://vscode.git/clone?url=${repo.clone_url}`;
    };

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
                <h2 className="text-2xl font-bold tracking-tight mb-4">Repositories</h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {repos.map(repo => (
                        <Card key={repo.id} className="flex flex-col">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-xl">
                                    <GitBranch className="h-5 w-5" />
                                    {repo.name}
                                </CardTitle>
                                <CardDescription className="flex-grow">
                                    {repo.description || "No description."}
                                </CardDescription>
                            </CardHeader>
                            <CardFooter>
                                <Button variant="secondary" size="sm" className="w-full" onClick={() => handleOpenInVSCode(repo)}>
                                    <Code className="mr-2 h-4 w-4" />
                                    Open in VS Code
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
                {!error && repos.length === 0 && !loading && (
                     <div className="text-center text-muted-foreground py-16">
                        <p>No repositories found.</p>
                        <p className="text-sm">Make sure you have granted access to your repositories.</p>
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
             <div className="flex items-center justify-center h-svh">
                <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
            </div>
        );
    }
    
    if (status === "unauthenticated" || !session) {
        return <UnauthenticatedView />;
    }

    return <RepoDashboard session={session} />;
}
