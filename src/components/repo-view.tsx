
"use client";

import { useState, useEffect, useCallback, useTransition, Suspense } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type { Repository, FileSystemNode, File as FileType } from '@/lib/types';
import { RepoExplorer } from '@/components/repo-explorer';
import { EditorView } from '@/components/editor-view';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, Loader2 } from 'lucide-react';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { getLanguageFromExtension } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

// Helper to sort files and folders
const sortNodes = (nodes: FileSystemNode[]) => {
    return nodes.sort((a, b) => {
        if (a.type === 'folder' && b.type !== 'folder') return -1;
        if (a.type !== 'folder' && b.type === 'folder') return 1;
        return a.name.localeCompare(b.name);
    });
};

async function fetchRepoDetails(repoFullName: string): Promise<Repository | null> {
    try {
        const res = await fetch(`/api/github/repos/${repoFullName}`);
        if (!res.ok) {
            console.error(`Failed to fetch repository details for ${repoFullName}. Status: ${res.status}`);
            return null;
        }
        const { data } = await res.json();
        return data;
    } catch (error) {
        console.error("Failed to fetch full repo details", error);
        return null;
    }
}

export function RepoView({ repoFullName }: { repoFullName: string }) {
    const [repoDetails, setRepoDetails] = useState<Repository | null>(null);
    const [fileTree, setFileTree] = useState<FileSystemNode[]>([]);
    const [selectedFile, setSelectedFile] = useState<FileType | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();
    
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();

    const updateUrlForFile = useCallback((filePath: string | null) => {
        const current = new URLSearchParams(Array.from(searchParams.entries()));
        if (filePath) {
            current.set('file', filePath);
        } else {
            current.delete('file');
        }
        const search = current.toString();
        const query = search ? `?${search}` : '';
        startTransition(() => {
            router.replace(`${pathname}${query}`);
        });
    }, [pathname, searchParams, router]);

    const fetchFileContent = useCallback(async (file: Pick<FileType, 'path' | 'language' | 'name' | 'sha' | 'url'>) => {
        if (selectedFile?.path === file.path && selectedFile.content !== '') {
            updateUrlForFile(file.path);
            return;
        }

        setSelectedFile({ ...file, content: '' }); 
        updateUrlForFile(file.path);

        try {
            const res = await fetch(`/api/github/repos/${repoFullName}/contents/${file.path}`);
            if (!res.ok) {
                const errorData = await res.json().catch(() => null);
                throw new Error(errorData?.message || 'Failed to fetch file content.');
            }
            const { data } = await res.json();
            if (data.encoding === 'base64' && data.content) {
                const content = atob(data.content);
                setSelectedFile({ ...file, sha: data.sha, content, language: file.language || 'plaintext' });
            } else {
                setSelectedFile({ ...file, sha: data.sha, content: 'File content is not available or file is empty.' });
            }
        } catch (err: any) {
            console.error(err);
            toast({ variant: 'destructive', title: "Error loading file", description: err.message });
            setSelectedFile(null);
            updateUrlForFile(null); // Clear from URL if fetch fails
        }
    }, [repoFullName, selectedFile?.path, selectedFile?.content, toast, updateUrlForFile]);


    useEffect(() => {
        const fetchRootAndLoadFile = async () => {
            if (!repoFullName) return;

            setLoading(true);
            setError(null);
            setFileTree([]);
            setSelectedFile(null);
            try {
                const [repoData, contentsRes] = await Promise.all([
                    fetchRepoDetails(repoFullName),
                    fetch(`/api/github/repos/${repoFullName}/contents`)
                ]);

                if (!repoData) {
                    throw new Error("Repository details could not be loaded.");
                }
                setRepoDetails(repoData);

                if (!contentsRes.ok) {
                    const errorData = await contentsRes.json().catch(() => ({ message: 'Failed to fetch repository contents.' }));
                    throw new Error(errorData.message);
                }

                const { data } = await contentsRes.json();
                if (!Array.isArray(data)) {
                    throw new Error("Invalid data format received from API.");
                }
                const nodes: FileSystemNode[] = data.map((item: any) => ({
                    name: item.name,
                    path: item.path,
                    type: item.type === 'dir' ? 'folder' : 'file',
                    sha: item.sha,
                    url: item.url,
                    children: item.type === 'dir' ? [] : undefined,
                    content: item.type === 'file' ? '' : undefined,
                    language: item.type === 'file' ? getLanguageFromExtension(item.name.split('.').pop() || '') : undefined,
                }));
                const sortedNodes = sortNodes(nodes);
                setFileTree(sortedNodes);

                const fileFromUrl = searchParams.get('file');
                if (fileFromUrl) {
                    await fetchFileContent({ path: fileFromUrl, name: fileFromUrl.split('/').pop() || '', sha: '', url: '', language: getLanguageFromExtension(fileFromUrl.split('.').pop() || '') });
                }

            } catch (err: any) {
                setError(err.message || 'An unexpected error occurred.');
            } finally {
                setLoading(false);
            }
        };

        fetchRootAndLoadFile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [repoFullName]); 

    const handleSelectFile = (file: FileType) => {
        fetchFileContent(file);
    };

    const handleFolderClick = useCallback(async (folderPath: string) => {
        try {
            const res = await fetch(`/api/github/repos/${repoFullName}/contents/${folderPath}`);
            if (!res.ok) throw new Error('Failed to fetch folder content');
            const { data } = await res.json();
             if (!Array.isArray(data)) {
                console.error("Folder content is not an array:", data);
                return;
            }
            const children: FileSystemNode[] = data.map((item: any) => ({
                name: item.name,
                path: item.path,
                type: item.type === 'dir' ? 'folder' : 'file',
                sha: item.sha,
                url: item.url,
                children: item.type === 'dir' ? [] : undefined,
                content: item.type === 'file' ? '' : undefined,
                language: item.type === 'file' ? getLanguageFromExtension(item.name.split('.').pop() || '') : undefined,
            }));

            const updateTree = (nodes: FileSystemNode[]): FileSystemNode[] => {
                return nodes.map(node => {
                    if (node.type === 'folder') {
                        if (node.path === folderPath) {
                            return { ...node, children: sortNodes(children) };
                        } else if (folderPath.startsWith(node.path + '/')) {
                            return { ...node, children: updateTree(node.children) };
                        }
                    }
                    return node;
                });
            };
            
            setFileTree(currentTree => updateTree(currentTree));

        } catch (err) {
            console.error("Failed to load folder contents:", err);
            toast({
                variant: 'destructive',
                title: 'Could not load folder',
                description: 'Please check the console for more details.'
            })
        }
    }, [repoFullName, toast]);

    const onCommitSuccess = (newFileState: FileType) => {
        setSelectedFile(newFileState);
        toast({
            title: "Commit Successful",
            description: `Changes to ${newFileState.name} have been committed.`,
        });
    };

    if (error) {
        return (
            <div className="flex items-center justify-center h-full p-4">
                <Alert variant="destructive" className="max-w-lg">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Error Loading Repository</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            </div>
        );
    }

    if (loading || !repoDetails) {
         return (
            <div className="flex h-full items-center justify-center">
                <Loader2 className="h-12 w-12 animate-pulse text-muted-foreground" />
            </div>
        );
    }

    return (
        <ResizablePanelGroup direction="horizontal" className="h-full w-full">
            <ResizablePanel defaultSize={20} minSize={15} maxSize={40}>
                <RepoExplorer 
                    repo={repoDetails}
                    nodes={fileTree}
                    onSelectFile={handleSelectFile}
                    onFolderClick={handleFolderClick}
                    selectedFile={selectedFile}
                    loading={loading}
                />
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={80}>
                <EditorView 
                    repo={repoDetails}
                    selectedFile={selectedFile} 
                    onCommitSuccess={onCommitSuccess} 
                />
            </ResizablePanel>
        </ResizablePanelGroup>
    );
}
