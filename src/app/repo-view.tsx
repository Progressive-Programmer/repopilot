
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

// Helper function to build the file tree
const buildFileTree = (paths: any[]): FileSystemNode[] => {
    const tree: { [key: string]: any } = {};

    const items = paths
      .filter(item => item.type === 'blob' || item.type === 'tree')
      .map(item => ({ ...item, parts: item.path.split('/') }));

    items.sort((a, b) => a.path.localeCompare(b.path));

    items.forEach(item => {
        let currentLevel = tree;
        item.parts.forEach((part: string, index: number) => {
            if (!currentLevel[part]) {
                if (item.type === 'tree' && index === item.parts.length - 1) {
                     currentLevel[part] = {
                        name: part,
                        path: item.path,
                        type: 'folder',
                        children: {},
                        url: item.url,
                        sha: item.sha,
                    };
                } else if (item.type === 'blob' && index === item.parts.length - 1) {
                    currentLevel[part] = {
                        name: part,
                        path: item.path,
                        type: 'file',
                        language: part.split('.').pop() || 'plaintext',
                        content: '', // Content will be fetched on demand
                        url: item.url,
                        sha: item.sha,
                    };
                } else {
                     currentLevel[part] = {
                        name: part,
                        path: item.parts.slice(0, index + 1).join('/'),
                        type: 'folder',
                        children: {},
                        url: '',
                        sha: '',
                    };
                }
            }
            if (currentLevel[part].type === 'folder') {
                currentLevel = currentLevel[part].children;
            }
        });
    });

    const convertToList = (currentLevel: any): FileSystemNode[] => {
        return Object.values(currentLevel).map((node: any) => {
            if (node.type === 'folder') {
                return { ...node, children: convertToList(node.children) };
            }
            return node;
        }).sort((a, b) => {
            if (a.type === 'folder' && b.type !== 'folder') return -1;
            if (a.type !== 'folder' && b.type === 'folder') return 1;
            return a.name.localeCompare(b.name);
        });
    };

    return convertToList(tree);
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
                const res = await fetch(`/api/github/repos/${repo.full_name}/git/trees/${repo.default_branch}?recursive=1`);
                if (!res.ok) {
                    const errorData = await res.json().catch(() => ({ message: 'Failed to fetch repository tree.' }));
                    throw new Error(errorData.message);
                }
                const data = await res.json();
                 if (data.truncated) {
                    console.warn("File tree is truncated. Some files may not be shown.");
                }
                const tree = buildFileTree(data.tree);
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

        setSelectedFile({ ...file, content: '' });

        try {
            const res = await fetch(`/api/github/repos/${repo.full_name}/contents/${file.path}`);
            if (!res.ok) {
                throw new Error('Failed to fetch file content.');
            }
            const data = await res.json();
            if (data.content) {
                const content = atob(data.content);
                setSelectedFile({ ...file, content, language: file.language || 'plaintext' });
            } else {
                 setSelectedFile({ ...file, content: 'File content is not available or file is empty.' });
            }
        } catch (err) {
            console.error(err);
            setSelectedFile({ ...file, content: 'Error loading file content.' });
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
