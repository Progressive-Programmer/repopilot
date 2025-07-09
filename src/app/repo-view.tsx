
"use client";

import { useState, useEffect, useCallback } from 'react';
import type { Repository, FileSystemNode, File as FileType } from './page';
import { RepoExplorer } from '@/components/repo-explorer';
import { EditorView } from '@/components/editor-view';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, Loader2 } from 'lucide-react';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";

// Helper function to build the file tree from a flat list of paths
const buildFileTree = (paths: { path: string; type: 'blob' | 'tree'; url: string; sha: string }[]): FileSystemNode[] => {
    const tree: { [key: string]: FileSystemNode } = {};

    // Sort paths to ensure parent directories are created before their children
    const sortedPaths = paths.sort((a, b) => a.path.localeCompare(b.path));

    sortedPaths.forEach(item => {
        const parts = item.path.split('/');
        let currentLevel: any = tree;

        parts.forEach((part, index) => {
            const isLastPart = index === parts.length - 1;

            if (!currentLevel[part]) {
                if (isLastPart && item.type === 'blob') {
                    currentLevel[part] = {
                        name: part,
                        path: item.path,
                        type: 'file',
                        language: part.split('.').pop() || 'plaintext',
                        content: '', // Will be fetched on demand
                        url: item.url,
                        sha: item.sha,
                    };
                } else {
                    currentLevel[part] = {
                        name: part,
                        path: parts.slice(0, index + 1).join('/'),
                        type: 'folder',
                        children: {}, // Use an object for easy child lookup
                        url: item.type === 'tree' ? item.url : '',
                        sha: item.type === 'tree' ? item.sha : '',
                    };
                }
            }

            if (currentLevel[part].type === 'folder') {
                currentLevel = currentLevel[part].children;
            }
        });
    });

    // Recursively convert children objects to sorted arrays
    const convertChildrenToArray = (node: any): FileSystemNode[] => {
        return Object.values(node)
            .map((child: any) => {
                if (child.type === 'folder') {
                    child.children = convertChildrenToArray(child.children);
                }
                return child;
            })
            .sort((a: any, b: any) => {
                if (a.type === 'folder' && b.type !== 'folder') return -1;
                if (a.type !== 'folder' && b.type === 'folder') return 1;
                return a.name.localeCompare(b.name);
            });
    };

    return convertChildrenToArray(tree);
};

export function RepoView({ repo }: { repo: Repository }) {
    const [files, setFiles] = useState<FileSystemNode[]>([]);
    const [selectedFile, setSelectedFile] = useState<FileType | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchFiles = async () => {
            setLoading(true);
            setError(null);
            try {
                // IMPORTANT: Added `recursive=1` to fetch the entire tree
                const res = await fetch(`/api/github/repos/${repo.full_name}/git/trees/${repo.default_branch}?recursive=1`);
                if (!res.ok) {
                    const errorData = await res.json().catch(() => ({ message: 'Failed to fetch repository tree.' }));
                    throw new Error(errorData.message);
                }
                const data = await res.json();
                 if (data.truncated) {
                    console.warn("File tree is truncated. Some files may not be shown.");
                }
                // Filter out non-blob/tree types (like 'commit' for submodules)
                const relevantItems = data.tree.filter((item: any) => item.type === 'blob' || item.type === 'tree');
                const tree = buildFileTree(relevantItems);
                setFiles(tree);
            } catch (err: any) {
                setError(err.message || 'An unexpected error occurred.');
            } finally {
                setLoading(false);
            }
        };

        fetchFiles();
    }, [repo]);
    
    const handleSelectFile = useCallback(async (file: FileType) => {
        if (selectedFile?.path === file.path && selectedFile.content) {
            return;
        }

        // Show loader immediately for better UX
        setSelectedFile({ ...file, content: '' });

        try {
            const res = await fetch(`/api/github/repos/${repo.full_name}/contents/${file.path}`);
            if (!res.ok) {
                const errorData = await res.json().catch(() => null);
                throw new Error(errorData?.message || 'Failed to fetch file content.');
            }
            const data = await res.json();
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
            <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
                <RepoExplorer 
                    repo={repo}
                    files={files}
                    onSelectFile={handleSelectFile}
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
