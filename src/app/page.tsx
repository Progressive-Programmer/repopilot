
"use client";

import { useState } from 'react';
import { Github, GitBranch, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { EditorView } from '@/components/editor-view';
import { RepoExplorer } from '@/components/repo-explorer';
import { GithubUI } from '@/components/github-ui';
import { repositories } from '@/lib/mock-data';
import type { Repository, File as FileType } from '@/lib/mock-data';

const Logo = () => (
    <div className="flex items-center gap-2">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-accent">
            <path d="M12 2L2 7V17L12 22L22 17V7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M2 7L12 12L22 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M12 22V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <h1 className="text-lg font-semibold font-headline">RepoPilot</h1>
    </div>
);

const RepoDashboard = ({ onSelectRepo }: { onSelectRepo: (repo: Repository) => void }) => (
    <div className="flex flex-col h-svh bg-background">
        <header className="flex items-center justify-between p-4 border-b h-16 shrink-0">
            <Logo />
            <GithubUI />
        </header>
        <main className="flex-1 overflow-auto p-4 md:p-8">
            <div className="max-w-4xl mx-auto">
                <h2 className="text-2xl font-bold tracking-tight mb-4">Repositories</h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {repositories.map(repo => (
                        <Card key={repo.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => onSelectRepo(repo)}>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-xl">
                                    <GitBranch className="h-5 w-5" />
                                    {repo.name}
                                </CardTitle>
                                <CardDescription>
                                    A brief description of the repository.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">Contains {repo.files.length} top-level files/folders.</p>
                            </CardContent>
                            <CardFooter>
                                <Button variant="secondary" size="sm" className="w-full">
                                    Open Repository
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            </div>
        </main>
    </div>
);

const RepoView = ({ repo, onBack }: { repo: Repository, onBack: () => void }) => {
    const [selectedFile, setSelectedFile] = useState<FileType | null>(null);

    return (
        <div className="flex h-svh">
            <div className="w-72 border-r bg-card flex flex-col">
                <RepoExplorer
                    repositories={[repo]}
                    onSelectFile={setSelectedFile}
                    selectedFile={selectedFile}
                />
            </div>
            <div className="flex-1 flex flex-col bg-background">
                <header className="flex items-center justify-between p-4 border-b h-16 shrink-0">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={onBack}>
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <h2 className="text-lg font-semibold">{repo.name}</h2>
                    </div>
                    <GithubUI />
                </header>
                <main className="flex-1 overflow-hidden">
                    <EditorView selectedFile={selectedFile} />
                </main>
            </div>
        </div>
    );
};

export default function Home() {
    const [selectedRepo, setSelectedRepo] = useState<Repository | null>(null);

    if (selectedRepo) {
        return <RepoView repo={selectedRepo} onBack={() => setSelectedRepo(null)} />;
    }

    return <RepoDashboard onSelectRepo={setSelectedRepo} />;
}
