
"use client";

import type { FC } from 'react';
import React, { useState } from 'react';
import { ChevronRight, File as FileIcon, Folder as FolderIcon, GitBranch, Loader2 } from 'lucide-react';
import type { Repository, FileSystemNode, File as FileType } from '@/app/page';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

interface RepoExplorerProps {
  repo: Repository;
  files: FileSystemNode[];
  onSelectFile: (file: FileType) => void;
  selectedFile: FileType | null;
  loading: boolean;
}

const FileNode: FC<{ node: FileSystemNode; onSelectFile: (file: FileType) => void; level: number, selectedFile: FileType | null }> = ({ node, onSelectFile, level, selectedFile }) => {
  const [isOpen, setIsOpen] = useState(true);

  if (node.type === 'folder') {
    return (
      <div className="text-sm">
        <div
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center w-full justify-start pr-2 cursor-pointer hover:bg-muted rounded-sm"
          style={{ paddingLeft: `${level * 1}rem` }}
        >
          <ChevronRight className={cn("h-4 w-4 mr-1 transition-transform shrink-0", isOpen && "rotate-90")} />
          <FolderIcon className="h-4 w-4 mr-2 shrink-0 text-foreground/80" />
          <span className="truncate py-1.5">{node.name}</span>
        </div>
        {isOpen && (
          <div className="flex flex-col">
            {node.children && node.children.sort((a,b) => a.type.localeCompare(b.type)).map((child) => (
              <FileNode key={child.path} node={child} onSelectFile={onSelectFile} level={level + 1} selectedFile={selectedFile} />
            ))}
          </div>
        )}
      </div>
    );
  }

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


export function RepoExplorer({ repo, files, onSelectFile, selectedFile, loading }: RepoExplorerProps) {
  return (
    <div className="h-full flex flex-col bg-card">
        <div className="p-4 border-b">
            <h2 className="text-base font-semibold tracking-tight font-headline">Explorer</h2>
        </div>
        <ScrollArea className="flex-1">
            <Accordion type="single" collapsible defaultValue={repo.id.toString()} className="w-full">
                <AccordionItem value={repo.id.toString()} className="border-b-0">
                    <AccordionTrigger className="px-4 py-2 text-sm hover:no-underline bg-muted/50 font-bold">
                        <div className="flex items-center">
                            <GitBranch className="h-4 w-4 mr-2" /> {repo.name}
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-1 pl-1 pt-1">
                      {loading ? (
                        <div className="flex justify-center p-4">
                            <Loader2 className="h-5 w-5 animate-spin" />
                        </div>
                      ) : (
                        <div className="flex flex-col gap-px p-1">
                            {files.sort((a, b) => a.type.localeCompare(b.type)).map((node) => (
                                <FileNode key={node.path} node={node} onSelectFile={onSelectFile} level={1} selectedFile={selectedFile} />
                            ))}
                        </div>
                      )}
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
      </ScrollArea>
    </div>
  );
}
