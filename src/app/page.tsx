"use client";

import { useState } from 'react';
import {
  SidebarProvider,
  Sidebar,
  SidebarInset,
  SidebarTrigger,
  SidebarContent
} from '@/components/ui/sidebar';
import { GithubUI } from '@/components/github-ui';
import { RepoExplorer } from '@/components/repo-explorer';
import { EditorView } from '@/components/editor-view';
import { repositories } from '@/lib/mock-data';
import type { File as FileType } from '@/lib/mock-data';

const Logo = () => (
  <div className="flex items-center gap-2">
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-accent">
      <path d="M12 2L2 7V17L12 22L22 17V7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M2 7L12 12L22 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M12 22V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
    <h1 className="text-lg font-semibold font-headline">RepoPilot</h1>
  </div>
);

export default function Home() {
  const [selectedFile, setSelectedFile] = useState<FileType | null>(null);

  const handleSelectFile = (file: FileType) => {
    setSelectedFile(file);
  };

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarContent className="p-0">
            <RepoExplorer 
              repositories={repositories} 
              onSelectFile={handleSelectFile} 
              selectedFile={selectedFile}
            />
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <div className="flex flex-col h-svh bg-background">
            <header className="flex items-center justify-between p-4 border-b h-16 shrink-0">
                <div className="flex items-center gap-4">
                    <SidebarTrigger className="md:hidden" />
                    <div className="hidden md:block">
                        <Logo />
                    </div>
                </div>
                <GithubUI />
            </header>
            <main className="flex-1 overflow-hidden">
                <EditorView selectedFile={selectedFile} />
            </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
