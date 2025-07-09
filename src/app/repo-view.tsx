
"use client";

import { useState, useEffect, useCallback } from 'react';
import type { Repository, FileSystemNode, File as FileType, Folder } from './page';
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


// Helper to sort files and folders
const sortNodes = (nodes: FileSystemNode[]) => {
    return nodes.sort((a, b) => {
        if (a.type === 'folder' && b.type !== 'folder') return -1;
        if (a.type !== 'folder' && b.type === 'folder') return 1;
        return a.name.localeCompare(b.name);
    });
};

export function RepoView({ repo }: { repo: Repository }) {
    const [fileTree, setFileTree] = useState<FileSystemNode[]>([]);
    const [selectedFile, setSelectedFile] = useState<FileType | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch initial root-level files
    useEffect(() => {
        const fetchRootFiles = async () => {
            setLoading(true);
            setError(null);
            setFileTree([]);
            setSelectedFile(null);
            try {
                const res = await fetch(`/api/github/repos/${repo.full_name}/contents`);
                if (!res.ok) {
                    const errorData = await res.json().catch(() => ({ message: 'Failed to fetch repository contents.' }));
                    throw new Error(errorData.message);
                }
                const { data } = await res.json();
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
                setFileTree(sortNodes(nodes));
            } catch (err: any) {
                setError(err.message || 'An unexpected error occurred.');
            } finally {
                setLoading(false);
            }
        };

        fetchRootFiles();
    }, [repo]);
    
    const handleSelectFile = useCallback(async (file: FileType) => {
        // Avoid refetching if content is already loaded
        if (selectedFile?.path === file.path && selectedFile.content) {
            return;
        }

        // Show loader immediately
        setSelectedFile({ ...file, content: '' });

        try {
            const res = await fetch(`/api/github/repos/${repo.full_name}/contents/${file.path}`);
            if (!res.ok) {
                const errorData = await res.json().catch(() => null);
                throw new Error(errorData?.message || 'Failed to fetch file content.');
            }
            const { data } = await res.json();
            if (data.encoding === 'base64' && data.content) {
                const content = atob(data.content);
                setSelectedFile({ ...file, content, language: file.language || 'plaintext' });
            } else {
                 setSelectedFile({ ...file, content: 'File content is not available or file is empty.' });
            }
        } catch (err: any) {
            console.error(err);
            setSelectedFile({ ...file, content: `Error loading file content: ${err.message}` });
        }
    }, [repo.full_name, selectedFile]);

    const handleFolderClick = useCallback(async (folderPath: string) => {
        try {
            const res = await fetch(`/api/github/repos/${repo.full_name}/contents/${folderPath}`);
            if (!res.ok) throw new Error('Failed to fetch folder content');
            const { data } = await res.json();
             if (!Array.isArray(data)) {
                console.error("Folder content is not an array:", data);
                // Optionally set an error state for this specific folder
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

            // This function recursively finds the folder and updates its children
            const updateTree = (nodes: FileSystemNode[]): FileSystemNode[] => {
                return nodes.map(node => {
                    if (node.type === 'folder') {
                        if (node.path === folderPath) {
                            // Found the folder, update its children
                            return { ...node, children: sortNodes(children) };
                        } else if (folderPath.startsWith(node.path + '/')) {
                            // The target folder is inside this one, recurse
                            return { ...node, children: updateTree(node.children) };
                        }
                    }
                    return node;
                });
            };
            
            setFileTree(currentTree => updateTree(currentTree));

        } catch (err) {
            console.error("Failed to load folder contents:", err);
            // Optionally set an error state for this specific folder
        }
    }, [repo.full_name]);

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

    return (
        <ResizablePanelGroup direction="horizontal" className="h-full w-full">
            <ResizablePanel defaultSize={20} minSize={15} maxSize={40}>
                <RepoExplorer 
                    repo={repo}
                    nodes={fileTree}
                    onSelectFile={handleSelectFile}
                    onFolderClick={handleFolderClick}
                    selectedFile={selectedFile}
                    loading={loading}
                />
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={80}>
                <EditorView selectedFile={selectedFile} />
            </ResizablePanel>
        </ResizablePanelGroup>
    );
}
