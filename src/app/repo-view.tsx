
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

// Helper function to build the file tree from a flat list of paths
const buildFileTree = (paths: { path: string; type: 'blob' | 'tree'; url: string; sha: string }[]): FileSystemNode[] => {
    const root: FileSystemNode[] = [];
    const nodeMap: { [path: string]: FileSystemNode } = {};

    // Sort paths by depth to ensure parent directories are created before children
    paths.sort((a, b) => a.path.split('/').length - b.path.split('/').length);

    paths.forEach(item => {
        const parts = item.path.split('/');
        const name = parts[parts.length - 1];
        const parentPath = parts.slice(0, -1).join('/');

        let newNode: FileSystemNode;

        if (item.type === 'tree') {
            newNode = {
                name,
                path: item.path,
                type: 'folder',
                children: [],
                url: item.url,
                sha: item.sha,
            };
        } else { // 'blob'
            newNode = {
                name,
                path: item.path,
                type: 'file',
                content: '', // Fetched on demand
                language: name.split('.').pop() || 'plaintext',
                url: item.url,
                sha: item.sha,
            };
        }

        nodeMap[item.path] = newNode;

        if (parentPath) {
            const parent = nodeMap[parentPath] as Folder;
            if (parent && parent.type === 'folder') {
                parent.children.push(newNode);
            }
        } else {
            root.push(newNode);
        }
    });

    // Recursively sort all children arrays
    const sortChildren = (node: FileSystemNode) => {
        if (node.type === 'folder' && node.children.length > 0) {
            node.children.forEach(sortChildren);
            node.children.sort((a, b) => {
                if (a.type === 'folder' && b.type !== 'folder') return -1;
                if (a.type !== 'folder' && b.type === 'folder') return 1;
                return a.name.localeCompare(b.name);
            });
        }
    };
    
    root.forEach(sortChildren);
    root.sort((a, b) => {
        if (a.type === 'folder' && b.type !== 'folder') return -1;
        if (a.type !== 'folder' && b.type === 'folder') return 1;
        return a.name.localeCompare(b.name);
    });

    return root;
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
            setFiles([]);
            setSelectedFile(null);
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
