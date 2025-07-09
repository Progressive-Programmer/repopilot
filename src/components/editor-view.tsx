
"use client";

import { useState, useTransition, useEffect, useRef } from 'react';
import { useTheme } from 'next-themes';
import { runCodeReview, commitFile } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Wand2, Loader2, BotMessageSquare, FileCode, Braces, GitCommitHorizontal } from 'lucide-react';
import type { File as FileType, Repository } from '@/app/page';
import { useToast } from '@/hooks/use-toast';
import Editor, { type OnMount } from '@monaco-editor/react';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"


interface EditorViewProps {
  repo: Repository;
  selectedFile: FileType | null;
  onCommitSuccess: (newFileState: FileType) => void;
}

const ReviewPanel = ({ file }: { file: FileType }) => {
  const [isPending, startTransition] = useTransition();
  const [review, setReview] = useState<string | null>(null);
  const { toast } = useToast();

  const handleGenerateReview = () => {
    if (!file.content) {
        toast({ variant: "destructive", title: "Error", description: "File content is not loaded." });
        return;
    }
    startTransition(async () => {
        setReview(null);
        const result = await runCodeReview({ code: file.content, language: file.language });
        if (result.error) {
            toast({ variant: "destructive", title: "Error", description: result.error });
            setReview(null);
        } else {
            setReview(result.review || null);
        }
    });
  };

  useEffect(() => {
    setReview(null);
  }, [file]);

  return (
    <Card className="h-full flex flex-col border-0 rounded-none">
      <CardHeader className="flex flex-row items-center justify-between border-b shrink-0 h-14">
        <CardTitle className="font-headline text-base">AI Code Review</CardTitle>
        <Button onClick={handleGenerateReview} disabled={isPending || !file.content} size="sm">
          {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
          Generate Review
        </Button>
      </CardHeader>
      <CardContent className="flex-1 overflow-auto p-0">
        <ScrollArea className="h-full">
          <div className="p-4">
            {isPending && (
              <div className="space-y-4 animate-in fade-in-50">
                <Skeleton className="h-6 w-1/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-full" />
              </div>
            )}
            {!isPending && review && (
              <div className="text-sm rounded-md bg-muted/50 p-4 animate-in fade-in-50">
                <pre className="font-sans whitespace-pre-wrap">{review}</pre>
              </div>
            )}
            {!isPending && !review && (
               <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-8 mt-16">
                  <BotMessageSquare className="h-12 w-12 mb-4" />
                  <h3 className="text-lg font-semibold">Ready for analysis</h3>
                  <p className="max-w-xs text-sm">
                      Click "Generate Review" to let our AI assistant analyze your code for improvements, potential bugs, and best practices.
                  </p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

const CommitDialog = ({
  repo,
  file,
  editorContent,
  onCommitSuccess,
  isDirty
}: {
  repo: Repository;
  file: FileType;
  editorContent: string;
  onCommitSuccess: (newFileState: FileType) => void;
  isDirty: boolean;
}) => {
  const [commitMessage, setCommitMessage] = useState(`Update ${file.name}`);
  const [isCommitting, startCommitTransition] = useTransition();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);

  const handleCommit = async () => {
    if (!commitMessage.trim()) {
      toast({ variant: 'destructive', title: 'Error', description: 'Commit message cannot be empty.' });
      return;
    }

    startCommitTransition(async () => {
      const result = await commitFile({
        repoFullName: repo.full_name,
        filePath: file.path,
        content: editorContent,
        sha: file.sha,
        commitMessage,
      });

      if (result.success) {
        // We need to fetch the new SHA for the file to allow subsequent commits
        const res = await fetch(`/api/github/repos/${repo.full_name}/contents/${file.path}`);
        const { data: updatedFileData } = await res.json();
        
        onCommitSuccess({ ...file, content: editorContent, sha: updatedFileData.sha });
        setIsOpen(false);
      } else {
        toast({
          variant: 'destructive',
          title: 'Commit Failed',
          description: result.error,
        });
      }
    });
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="sm" disabled={!isDirty}>
          <GitCommitHorizontal className="mr-2 h-4 w-4" />
          Commit Changes
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Commit changes to {file.name}</DialogTitle>
          <DialogDescription>
            Enter a commit message to describe your changes.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="commit-message" className="text-right">
              Message
            </Label>
            <Input
              id="commit-message"
              value={commitMessage}
              onChange={(e) => setCommitMessage(e.target.value)}
              className="col-span-3"
              placeholder={`Update ${file.name}`}
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" disabled={isCommitting}>Cancel</Button>
          </DialogClose>
          <Button onClick={handleCommit} disabled={isCommitting}>
            {isCommitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Commit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function EditorView({ repo, selectedFile, onCommitSuccess }: EditorViewProps) {
  const { theme } = useTheme();
  const editorRef = useRef<any>(null);
  const [editorContent, setEditorContent] = useState<string>('');
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (selectedFile) {
      setEditorContent(selectedFile.content);
      setIsDirty(false);
    }
  }, [selectedFile]);

  const handleEditorChange = (value: string | undefined) => {
    const content = value || '';
    setEditorContent(content);
    if (selectedFile) {
        setIsDirty(content !== selectedFile.content);
    }
  };

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
  };

  const handleFormatCode = () => {
    if (editorRef.current) {
      editorRef.current.getAction('editor.action.formatDocument').run();
    }
  };

  if (!selectedFile) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-background text-muted-foreground">
        <FileCode className="h-16 w-16 mb-4" />
        <p className="text-lg">Select a file to begin</p>
        <p className="text-sm">The code and AI review will be displayed here.</p>
      </div>
    );
  }

  if (selectedFile.content === '' && editorContent === '') {
     return (
      <div className="flex h-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <ResizablePanelGroup direction="horizontal" className="h-full">
      <ResizablePanel defaultSize={75}>
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/50 h-14 shrink-0">
             <div className="font-mono text-sm">{selectedFile.name} {isDirty && <span className="text-muted-foreground">*</span>}</div>
             <div className="flex items-center gap-2">
                <CommitDialog
                    repo={repo}
                    file={selectedFile}
                    editorContent={editorContent}
                    onCommitSuccess={onCommitSuccess}
                    isDirty={isDirty}
                />
                <Button variant="ghost" size="sm" onClick={handleFormatCode}>
                    <Braces className="mr-2 h-4 w-4" />
                    Format Code
                </Button>
             </div>
          </div>
          <div className="flex-1 overflow-hidden">
            <Editor
              height="100%"
              path={selectedFile.path}
              language={selectedFile.language}
              value={editorContent}
              theme={theme === 'dark' ? 'vs-dark' : 'vs-light'}
              onMount={handleEditorDidMount}
              onChange={handleEditorChange}
              options={{
                wordWrap: 'on',
                minimap: { enabled: true },
                scrollBeyondLastLine: false,
                fontFamily: "var(--font-code)",
                automaticLayout: true,
              }}
            />
          </div>
        </div>
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize={25} minSize={20}>
        <ReviewPanel file={{...selectedFile, content: editorContent}} />
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
