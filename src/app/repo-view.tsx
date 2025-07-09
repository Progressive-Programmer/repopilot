
"use client";

import { useState, useEffect, useCallback } from 'react';
import type { Repository, FileSystemNode, File as FileType } from './page';
import { RepoExplorer } from '@/components/repo-explorer';
import { EditorView } from '@/components/editor-view';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

// Helper function to build the file tree
const buildFileTree = (paths: any[]): FileSystemNode[] => {
    const tree: { [key: string]: any } = {};

    paths.forEach(item => {
        const parts = item.path.split('/');
        let currentLevel = tree;

        parts.forEach((part, index) => {
            if (index === parts.length - 1 && item.type === 'blob') {
                currentLevel[part] = {
                    name: part,
                    path: item.path,
                    type: 'file',
                    language: part.split('.').pop() || 'plaintext',
                    content: '', // Content will be fetched on demand
                    url: item.url,
                    sha: item.sha,
                };
            } else if(item.type === 'tree') {
                if (!currentLevel[part]) {
                    currentLevel[part] = {
                        name: part,
                        path: item.path,
                        type: 'folder',
                        children: {},
                        url: item.url,
                        sha: item.sha,
                    };
                }
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
        // Set file as selected immediately for responsive UI, but clear content
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
            // Keep the file selected, but show an error message in its content
            setSelectedFile({ ...file, content: 'Error loading file content.' });
        }
    }, [repo.full_name]);

    return (
        <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] h-full">
            <div className="h-full border-r hidden md:block">
                 <RepoExplorer 
                    repo={repo}
                    files={files}
                    onSelectFile={handleSelectFile}
                    selectedFile={selectedFile}
                    loading={loading}
                />
            </div>
            <div className="h-full">
                 {error ? (
                    <div className="flex items-center justify-center h-full p-4">
                        <Alert variant="destructive" className="max-w-lg">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertTitle>Error Loading Repository</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    </div>
                ) : (
                    <EditorView selectedFile={selectedFile} />
                )}
            </div>
        </div>
    );
}
