
"use client";

import { useState, useTransition, useEffect, useRef } from 'react';
import { useTheme } from 'next-themes';
import { runCodeReview } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Wand2, Loader2, BotMessageSquare, FileCode, Braces } from 'lucide-react';
import type { File as FileType } from '@/app/page';
import { useToast } from '@/hooks/use-toast';
import Editor, { type OnMount } from '@monaco-editor/react';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";

interface EditorViewProps {
  selectedFile: FileType | null;
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

export function EditorView({ selectedFile }: EditorViewProps) {
  const { theme } = useTheme();
  const editorRef = useRef<any>(null);

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

  if (selectedFile.content === '') {
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
             <div className="font-mono text-sm">{selectedFile.name}</div>
             <Button variant="ghost" size="sm" onClick={handleFormatCode}>
                <Braces className="mr-2 h-4 w-4" />
                Format Code
             </Button>
          </div>
          <div className="flex-1 overflow-hidden">
            <Editor
              height="100%"
              path={selectedFile.path}
              language={selectedFile.language}
              defaultValue={selectedFile.content}
              theme={theme === 'dark' ? 'vs-dark' : 'vs-light'}
              onMount={handleEditorDidMount}
              options={{
                readOnly: true,
                domReadOnly: true,
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
        <ReviewPanel file={selectedFile} />
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
