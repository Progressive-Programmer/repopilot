
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
    const fileTree: any = {};

    // Sort paths to ensure parent directories are processed before their children
    const sortedPaths = paths.sort((a, b) => a.path.localeCompare(b.path));

    for (const item of sortedPaths) {
        const parts = item.path.split('/');
        let currentLevel = fileTree;

        for (let i = 0; i < parts.length; i++) {
            const part = parts[i];
            const isLastPart = i === parts.length - 1;

            if (isLastPart) {
                if (item.type === 'blob') { // It's a file
                     currentLevel[part] = {
                        name: part,
                        path: item.path,
                        type: 'file',
                        language: part.split('.').pop() || 'plaintext',
                        content: '', // Content will be fetched on demand
                        url: item.url,
                        sha: item.sha,
                    };
                } else { // It's a folder (tree)
                    if (!currentLevel[part]) {
                         currentLevel[part] = {
                            name: part,
                            path: item.path,
                            type: 'folder',
                            children: [],
                            url: item.url,
                            sha: item.sha,
                        };
                    }
                }
            } else { // It's a directory path part
                if (!currentLevel[part]) {
                     currentLevel[part] = {
                        name: part,
                        path: parts.slice(0, i + 1).join('/'),
                        type: 'folder',
                        children: [], // Initialize children as an array
                        url: '',
                        sha: '',
                     };
                }
                 // Convert children object to array if it's not already
                if (!Array.isArray(currentLevel[part].children)) {
                   currentLevel[part].children = Object.values(currentLevel[part].children);
                }
                
                // Find the child to traverse into
                let childNode = currentLevel[part].children.find((c: any) => c.name === parts[i+1]);
                if(!childNode) {
                    currentLevel = currentLevel[part].children;
                } else {
                    currentLevel = childNode;
                }
            }
        }
    }
    
    // Convert the tree object to an array of nodes for the root level
    const convertToNodeArray = (obj: any): FileSystemNode[] => {
        return Object.values(obj).sort((a: any, b: any) => {
             if (a.type === 'folder' && b.type !== 'folder') return -1;
             if (a.type !== 'folder' && b.type === 'folder') return 1;
             return a.name.localeCompare(b.name);
        });
    };

    // Recursive function to convert children objects to arrays
    const finalizeTree = (nodes: FileSystemNode[]) => {
        for (const node of nodes) {
            if (node.type === 'folder' && !Array.isArray(node.children)) {
                node.children = convertToNodeArray(node.children);
                finalizeTree(node.children);
            }
        }
    };
    
    const rootNodes = convertToNodeArray(fileTree);
    finalizeTree(rootNodes);
    
    // A final pass to fix the children structure.
    // The previous logic had issues with converting object-based children to arrays recursively.
    const finalTree: { [key: string]: FileSystemNode } = {};

    for (const item of sortedPaths) {
      let currentPath = '';
      let parent: any = finalTree;

      item.path.split('/').forEach((part, index, arr) => {
        currentPath = currentPath ? `${currentPath}/${part}` : part;
        const isFile = item.type === 'blob' && index === arr.length - 1;

        if (!parent[part]) {
          if (isFile) {
            parent[part] = {
              name: part,
              path: item.path,
              type: 'file',
              language: part.split('.').pop() || 'plaintext',
              content: '',
              url: item.url,
              sha: item.sha,
            };
          } else {
             parent[part] = {
                name: part,
                path: currentPath,
                type: 'folder',
                children: {},
                url: item.url,
                sha: item.sha,
            };
          }
        }
        if (parent[part].type === 'folder') {
            parent = parent[part].children;
        }
      });
    }

    const convertObjectToArray = (node: any): FileSystemNode[] => {
        return Object.values(node).map((child: any) => {
            if(child.type === 'folder') {
                child.children = convertObjectToArray(child.children);
            }
            return child;
        }).sort((a,b) => {
            if (a.type === 'folder' && b.type !== 'folder') return -1;
            if (a.type !== 'folder' && b.type === 'folder') return 1;
            return a.name.localeCompare(b.name);
        });
    }

    return convertObjectToArray(finalTree);
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
