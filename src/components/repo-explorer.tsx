"use client";

import type { FC } from 'react';
import React, { useState } from 'react';
import { ChevronRight, File as FileIcon, Folder as FolderIcon, GitBranch } from 'lucide-react';
import type { Repository, FileSystemNode, File as FileType } from '@/lib/mock-data';
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
  repositories: Repository[];
  onSelectFile: (file: FileType) => void;
  selectedFile: FileType | null;
}

const FileNode: FC<{ node: FileSystemNode; onSelectFile: (file: FileType) => void; level: number, selectedFile: FileType | null }> = ({ node, onSelectFile, level, selectedFile }) => {
  const [isOpen, setIsOpen] = useState(true);

  if (node.type === 'folder') {
    return (
      <div className="text-sm">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center w-full justify-start pr-2"
          style={{ paddingLeft: `${level * 1}rem` }}
        >
          <ChevronRight className={cn("h-4 w-4 mr-1 transition-transform shrink-0", isOpen && "rotate-90")} />
          <FolderIcon className="h-4 w-4 mr-2 shrink-0 text-foreground/80" />
          <span className="truncate">{node.name}</span>
        </Button>
        {isOpen && (
          <div className="flex flex-col">
            {node.children.map((child) => (
              <FileNode key={child.name} node={child} onSelectFile={onSelectFile} level={level + 1} selectedFile={selectedFile} />
            ))}
          </div>
        )}
      </div>
    );
  }

  const isActive = selectedFile?.name === node.name && selectedFile?.content === node.content;
  return (
    <div className="text-sm">
      <Button
        variant={isActive ? "secondary" : "ghost"}
        size="sm"
        className="flex items-center w-full justify-start pr-2"
        style={{ paddingLeft: `${level * 1}rem` }}
        onClick={() => onSelectFile(node)}
      >
        <FileIcon className="h-4 w-4 mr-2 shrink-0 text-foreground/60" />
        <span className="truncate">{node.name}</span>
      </Button>
    </div>
  );
};


export function RepoExplorer({ repositories, onSelectFile, selectedFile }: RepoExplorerProps) {
  return (
    <div className="h-full flex flex-col bg-card">
        <div className="p-4 border-b">
            <h2 className="text-base font-semibold tracking-tight font-headline">Explorer</h2>
        </div>
        <ScrollArea className="flex-1">
            <Accordion type="multiple" defaultValue={repositories.map(r => r.id)} className="w-full">
            {repositories.map((repo) => (
                <AccordionItem value={repo.id} key={repo.id} className="border-b">
                    <AccordionTrigger className="px-4 py-2 text-sm hover:no-underline bg-background">
                        <div className="flex items-center">
                            <GitBranch className="h-4 w-4 mr-2" /> {repo.name}
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-1 pl-1">
                      <div className="flex flex-col gap-px">
                          {repo.files.map((node) => (
                          <FileNode key={node.name} node={node} onSelectFile={onSelectFile} level={1} selectedFile={selectedFile} />
                          ))}
                      </div>
                    </AccordionContent>
                </AccordionItem>
            ))}
            </Accordion>
      </ScrollArea>
    </div>
  );
}
