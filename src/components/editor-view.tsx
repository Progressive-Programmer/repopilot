
"use client";

import { useState, useTransition, useEffect, useRef } from 'react';
import { useTheme } from 'next-themes';
import dynamic from 'next/dynamic';
import { commitFile, runDiffReview, runCodeReview } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Wand2, Loader2, BotMessageSquare, FileCode, Braces, GitCommitHorizontal, AlertCircle, TriangleAlert, Info, Lightbulb } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { OnMount } from '@monaco-editor/react';
import type * as monaco from 'monaco-editor';
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
  DialogClose,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { File as FileType, Repository, Suggestion } from '@/lib/types';
import { useApi } from '@/hooks/use-api';

const Editor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => <Skeleton className="w-full h-full" />,
});

const DiffEditor = dynamic(() => import('@monaco-editor/react').then(mod => mod.DiffEditor), {
  ssr: false,
  loading: () => <Skeleton className="w-full h-full" />,
});

const SeverityIcon = ({ severity }: { severity: Suggestion['severity'] }) => {
    switch (severity) {
        case 'Critical':
            return <AlertCircle className="h-4 w-4 text-red-500" />;
        case 'Warning':
            return <TriangleAlert className="h-4 w-4 text-yellow-500" />;
        case 'Improvement':
            return <Wand2 className="h-4 w-4 text-blue-500" />;
        default:
            return <Info className="h-4 w-4 text-gray-500" />;
    }
};

const SeverityBadge = ({ severity }: { severity: Suggestion['severity'] }) => {
    return (
        <Badge
            variant="outline"
            className={cn(
                'text-xs shrink-0',
                severity === 'Critical' && 'border-red-500/50 text-red-500',
                severity === 'Warning' && 'border-yellow-500/50 text-yellow-500',
                severity === 'Improvement' && 'border-blue-500/50 text-blue-500'
            )}
        >
            {severity}
        </Badge>
    );
};


const ReviewPanel = ({ 
    file, 
    editorRef,
    review,
    isReviewPending,
    onGenerateReview,
}: { 
    file: FileType, 
    editorRef: React.RefObject<monaco.editor.IStandaloneCodeEditor | null>,
    review: Suggestion[] | null,
    isReviewPending: boolean,
    onGenerateReview: () => void,
}) => {
  const { toast } = useToast();
  const { theme } = useTheme();

  const handleApplySuggestion = (suggestion: Suggestion) => {
    const editor = editorRef.current;
    if (!editor || !suggestion.suggestion) return;

    const model = editor.getModel();
    if (!model) return;

    const [startLine, endLineStr] = suggestion.lines.split('-');
    const endLine = endLineStr ? parseInt(endLineStr) : parseInt(startLine);
    const range = new monaco.Range(parseInt(startLine), 1, endLine, model.getLineMaxColumn(endLine));
    
    editor.executeEdits('ai-suggestion', [{
        range: range,
        text: suggestion.suggestion,
        forceMoveMarkers: true,
    }]);

     toast({
      title: "Suggestion Applied",
      description: "The code has been updated in the editor.",
    });
  };

  const getOriginalCode = (suggestion: Suggestion): string => {
    const editor = editorRef.current;
    if (!editor) return '';

    const model = editor.getModel();
    if (!model) return '';

    const [startLine, endLineStr] = suggestion.lines.split('-');
    const endLine = endLineStr ? parseInt(endLineStr) : parseInt(startLine);
    
    const lines: string[] = [];
    for (let i = parseInt(startLine); i <= endLine; i++) {
        if (i <= model.getLineCount()) {
            lines.push(model.getLineContent(i));
        }
    }
    return lines.join('\n');
  };
  
  return (
    <Card className="h-full flex flex-col border-0 rounded-none">
      <CardHeader className="flex flex-row items-center justify-between border-b shrink-0 h-12 p-3">
        <CardTitle className="font-headline text-base flex items-center gap-2">
            <BotMessageSquare className="h-4 w-4" />
            AI Code Review
        </CardTitle>
        <Button onClick={onGenerateReview} disabled={isReviewPending || !file.content} size="sm">
          {isReviewPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
          Generate
        </Button>
      </CardHeader>
      <CardContent className="flex-1 overflow-auto p-0">
        <ScrollArea className="h-full">
          <div className="p-4">
            {isReviewPending && (
              <div className="space-y-4 animate-in fade-in-50">
                <Skeleton className="h-6 w-1/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-full" />
              </div>
            )}
            {!isReviewPending && review && (
              <Accordion type="multiple" className="w-full space-y-2">
                {review.map((suggestion, index) => (
                    <AccordionItem key={index} value={`item-${index}`} className="bg-card border rounded-md">
                       <AccordionTrigger className="text-sm text-left hover:no-underline px-3 py-3 w-full">
                           <div className="flex items-start gap-3 w-full">
                                <SeverityIcon severity={suggestion.severity} />
                                <span className="flex-1 font-medium text-left break-words">{suggestion.title}</span>
                                <SeverityBadge severity={suggestion.severity} />
                           </div>
                       </AccordionTrigger>
                       <AccordionContent className="p-4 border-t text-muted-foreground text-sm space-y-4">
                           <p className="font-semibold text-foreground">Lines: {suggestion.lines}</p>
                           <p className="whitespace-pre-wrap">{suggestion.description}</p>
                           {suggestion.suggestion && (
                               <div className="space-y-2">
                                  <div className='rounded-lg border overflow-hidden'>
                                    <DiffEditor
                                        height="150px"
                                        language={file.language}
                                        original={getOriginalCode(suggestion)}
                                        modified={suggestion.suggestion}
                                        theme={theme === 'dark' ? 'vs-dark' : 'vs-light'}
                                        options={{ 
                                            readOnly: true, 
                                            renderSideBySide: false, 
                                            minimap: { enabled: false },
                                            scrollBeyondLastLine: false,
                                            fontFamily: "var(--font-code)",
                                        }}
                                    />
                                  </div>
                                   <Button size="sm" onClick={() => handleApplySuggestion(suggestion)}>
                                       <Lightbulb className="mr-2 h-4 w-4" />
                                       Apply Suggestion
                                   </Button>
                               </div>
                           )}
                       </AccordionContent>
                   </AccordionItem>
                ))}
              </Accordion>
            )}
            {!isReviewPending && !review && (
               <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-8 mt-16">
                  <BotMessageSquare className="h-12 w-12 mb-4" />
                  <h3 className="text-lg font-semibold">Ready for analysis</h3>
                  <p className="max-w-xs text-sm">
                      Click "Generate" to let our AI assistant analyze your code.
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
  const { get } = useApi();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setCommitMessage(`Update ${file.name}`);
  }, [file.name]);

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
        try {
            const { data: updatedFileData, error } = await get(`/api/github/repos/${repo.full_name}/contents/${file.path}`);
            if (error) throw new Error("Failed to fetch updated file SHA");
            
            onCommitSuccess({ ...file, content: editorContent, sha: updatedFileData.sha });
            setIsOpen(false);
        } catch(e) {
             toast({
                variant: 'destructive',
                title: 'Commit Successful, but failed to update state',
                description: 'Please refresh the file to make further commits.',
            });
             setIsOpen(false);
        }
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
  );
}

export function EditorView({ repo, selectedFile, onCommitSuccess }: EditorViewProps) {
  const { theme } = useTheme();
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  
  const [originalContent, setOriginalContent] = useState<string>('');
  const [editorContent, setEditorContent] = useState<string>('');
  const [isDirty, setIsDirty] = useState(false);

  const [isReviewPending, startReviewTransition] = useTransition();
  const [review, setReview] = useState<Suggestion[] | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (selectedFile) {
      setOriginalContent(selectedFile.content);
      setEditorContent(selectedFile.content);
      setIsDirty(false);
      setReview(null); // Clear previous review when file changes
    }
  }, [selectedFile]);

  const handleGenerateReview = () => {
    if (!selectedFile) return;

    startReviewTransition(async () => {
        setReview(null);
        // If the file is not dirty, run a full review. Otherwise, run a diff review.
        const result = isDirty 
            ? await runDiffReview(originalContent, editorContent, selectedFile.language)
            : await runCodeReview({ code: editorContent, language: selectedFile.language });

        if (result.error) {
            toast({ variant: "destructive", title: "Review Error", description: result.error });
            setReview(null);
        } else {
            setReview(result.review || null);
             if (result.review?.length === 0) {
                 toast({ title: "No issues found", description: "The AI didn't find any issues in the changes." });
             }
        }
    });
  };

  const handleEditorChange = (value: string | undefined) => {
    const content = value || '';
    setEditorContent(content);
    setIsDirty(content !== originalContent);
  };

  const handleEditorDidMount: OnMount = (editor) => {
    editorRef.current = editor;
  };

  const handleFormatCode = () => {
    editorRef.current?.getAction('editor.action.formatDocument')?.run();
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

  // Show a loader specific to the editor content
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
          <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/50 h-12 shrink-0">
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
        <ReviewPanel 
            file={{...selectedFile, content: editorContent}} 
            editorRef={editorRef}
            review={review}
            isReviewPending={isReviewPending}
            onGenerateReview={handleGenerateReview}
        />
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
