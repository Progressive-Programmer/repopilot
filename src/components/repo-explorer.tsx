
"use client";

import type { FC } from 'react';
import React, { useState } from 'react';
import { ChevronRight, File as FileIcon, Folder as FolderIcon, GitBranch, Loader2 } from 'lucide-react';
import type { Repository, FileSystemNode, File as FileType } from '@/app/page';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

interface RepoExplorerProps {
  repo: Repository;
  nodes: FileSystemNode[];
  onSelectFile: (file: FileType) => void;
  onFolderClick: (path: string) => Promise<void>;
  selectedFile: FileType | null;
  loading: boolean;
}

const NodeDisplay: FC<{ 
    node: FileSystemNode; 
    onSelectFile: (file: FileType) => void; 
    onFolderClick: (path: string) => Promise<void>;
    level: number;
    selectedFile: FileType | null 
}> = ({ node, onSelectFile, onFolderClick, level, selectedFile }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleToggle = async () => {
    if (node.type === 'folder') {
      if (!isOpen && node.children.length === 0) {
        setIsLoading(true);
        await onFolderClick(node.path);
        setIsLoading(false);
      }
      setIsOpen(!isOpen);
    }
  };

  if (node.type === 'folder') {
    return (
      <div className="text-sm">
        <div
          onClick={handleToggle}
          className="flex items-center w-full justify-start pr-2 cursor-pointer hover:bg-muted rounded-sm"
          style={{ paddingLeft: `${level * 1}rem` }}
        >
          <ChevronRight className={cn("h-4 w-4 mr-1 transition-transform shrink-0", isOpen && "rotate-90")} />
          {isLoading ? (
            <Loader2 className="h-4 w-4 mr-2 shrink-0 animate-spin" />
          ) : (
            <FolderIcon className="h-4 w-4 mr-2 shrink-0 text-foreground/80" />
          )}
          <span className="truncate py-1.5">{node.name}</span>
        </div>
        {isOpen && !isLoading && (
          <div className="flex flex-col">
            {node.children && node.children.map((child) => (
              <NodeDisplay key={child.path} node={child} onSelectFile={onSelectFile} onFolderClick={onFolderClick} level={level + 1} selectedFile={selectedFile} />
            ))}
          </div>
        )}
      </div>
    );
  }

  // It's a file
  const isActive = selectedFile?.path === node.path;
  return (
    <div className="text-sm">
      <Button
        variant={isActive ? "secondary" : "ghost"}
        size="sm"
        className="flex items-center w-full justify-start pr-2 h-auto"
        style={{ paddingLeft: `${level * 1}rem` }}
        onClick={() => onSelectFile(node as FileType)}
      >
        <FileIcon className="h-4 w-4 mr-2 shrink-0 text-foreground/60" />
        <span className="truncate">{node.name}</span>
      </Button>
    </div>
  );
};


export function RepoExplorer({ repo, nodes, onSelectFile, onFolderClick, selectedFile, loading }: RepoExplorerProps) {
  return (
    <div className="h-full flex flex-col bg-background border-r">
        <div className="p-3 border-b h-14 flex items-center">
            <h2 className="text-base font-semibold tracking-tight font-headline">Explorer</h2>
        </div>
        <ScrollArea className="flex-1">
            <div className="p-2">
              <h3 className="flex items-center gap-2 px-2 py-1 text-sm font-semibold">
                <GitBranch className="h-4 w-4" /> {repo.name}
              </h3>
              {loading ? (
                <div className="flex justify-center p-4">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="flex flex-col gap-px p-1">
                    {nodes.map((node) => (
                        <NodeDisplay key={node.path} node={node} onSelectFile={onSelectFile} onFolderClick={onFolderClick} level={1} selectedFile={selectedFile} />
                    ))}
                </div>
              )}
            </div>
      </ScrollArea>
    </div>
  );
}
