
"use client";

import { useState, useEffect } from 'react';
import { useSession, signIn } from "next-auth/react";
import { Github, GitBranch, ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { EditorView } from '@/components/editor-view';
import { RepoExplorer } from '@/components/repo-explorer';
import { GithubUI } from '@/components/github-ui';

// Simplified types for GitHub API responses
export interface Repository {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  owner: {
    login: string;
  };
}

export interface File {
  name: string;
  type: 'file';
  path: string;
  content: string;
  language: string; // You might need to determine this based on file extension
}

export interface Folder {
    name: string;
    type: 'folder';
    path: string;
    children: (File | Folder)[];
}

export type FileSystemNode = File | Folder;


async function getRepoContents(repoFullName: string, path: string = ''): Promise<FileSystemNode[]> {
    const res = await fetch(`/api/github/repos/${repoFullName}/contents/${path}`);
    if (!res.ok) {
        throw new Error('Failed to fetch repository contents');
    }
    const contents = await res.json();

    return contents.map((item: any) => {
        if (item.type === 'dir') {
            return {
                name: item.name,
                type: 'folder',
                path: item.path,
                children: [], // Initially empty, can be fetched on-demand
            };
        } else {
            return {
                name: item.name,
                type: 'file',
                path: item.path,
                content: '', // Content will be fetched when the file is selected
                language: item.name.split('.').pop() || 'plaintext',
            };
        }
    });
}

async function getFileContent(repoFullName: string, path: string): Promise<string> {
    const res = await fetch(`/api/github/repos/${repoFullName}/contents/${path}`);
    if (!res.ok) {
        throw new Error('Failed to fetch file content');
    }
    const fileData = await res.json();
    if (typeof fileData.content !== 'string' || fileData.encoding !== 'base64') {
        throw new Error('Invalid file data received from GitHub API');
    }
    // `atob` is available in modern browsers and worker threads
    return atob(fileData.content);
}


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

const RepoDashboard = ({ onSelectRepo }: { onSelectRepo: (repo: Repository) => void }) => {
    const [repos, setRepos] = useState<Repository[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchRepos() {
            setLoading(true);
            try {
                const res = await fetch('/api/github/user/repos');
                if (res.ok) {
                    const data = await res.json();
                    setRepos(data);
                } else {
                    console.error("Failed to fetch repos");
                    setRepos([]);
                }
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        }
        fetchRepos();
    }, []);

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
                <h2 className="text-2xl font-bold tracking-tight mb-4">Repositories</h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {repos.map(repo => (
                        <Card key={repo.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => onSelectRepo(repo)}>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-xl">
                                    <GitBranch className="h-5 w-5" />
                                    {repo.name}
                                </CardTitle>
                                <CardDescription>
                                    {repo.description || "No description."}
                                </CardDescription>
                            </CardHeader>
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
};

const RepoView = ({ repo, onBack }: { repo: Repository, onBack: () => void }) => {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [files, setFiles] = useState<FileSystemNode[]>([]);
    const [loadingFiles, setLoadingFiles] = useState(true);

    useEffect(() => {
        setLoadingFiles(true);
        getRepoContents(repo.full_name)
            .then(setFiles)
            .catch(console.error)
            .finally(() => setLoadingFiles(false));
    }, [repo.full_name]);

    const handleSelectFile = async (file: File) => {
        if (file.content) {
            setSelectedFile(file);
            return;
        }
        
        try {
            const content = await getFileContent(repo.full_name, file.path);
            const updatedFile = { ...file, content };
            setSelectedFile(updatedFile);

            // Update the file in the tree
            const updateFilesInTree = (nodes: FileSystemNode[]): FileSystemNode[] => {
                return nodes.map(node => {
                    if (node.type === 'file' && node.path === file.path) {
                        return updatedFile;
                    }
                    if (node.type === 'folder' && file.path.startsWith(node.path)) {
                         return { ...node, children: updateFilesInTree(node.children) };
                    }
                    return node;
                });
            };
            setFiles(updateFilesInTree);
        } catch (error) {
            console.error("Failed to fetch file content:", error);
        }
    };


    return (
        <div className="flex h-svh">
            <div className="w-72 border-r bg-card flex flex-col">
                <RepoExplorer
                    repo={repo}
                    files={files}
                    onSelectFile={handleSelectFile}
                    selectedFile={selectedFile}
                    loading={loadingFiles}
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
    const { data: session, status } = useSession();
    const [selectedRepo, setSelectedRepo] = useState<Repository | null>(null);

    if (status === "loading") {
        return (
             <div className="flex items-center justify-center h-svh">
                <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
            </div>
        );
    }
    
    if (status === "unauthenticated") {
        return <UnauthenticatedView />;
    }

    if (selectedRepo) {
        return <RepoView repo={selectedRepo} onBack={() => setSelectedRepo(null)} />;
    }

    return <RepoDashboard onSelectRepo={setSelectedRepo} />;
}
