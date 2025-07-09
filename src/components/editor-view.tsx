
"use client";

import { useState, useTransition, useEffect, useMemo } from 'react';
import { runCodeReview } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Wand2, Loader2, BotMessageSquare } from 'lucide-react';
import type { File as FileType } from '@/app/page';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

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
    <Card className="h-full flex flex-col border-0 md:border">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="font-headline">AI Code Review</CardTitle>
        <Button onClick={handleGenerateReview} disabled={isPending} size="sm">
          {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
          Generate Review
        </Button>
      </CardHeader>
      <CardContent className="flex-1 overflow-auto p-0 md:p-6 md:pt-0">
        <ScrollArea className="h-full">
          <div className="p-4 md:p-0">
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
              <div className="text-sm rounded-md bg-muted p-4 animate-in fade-in-50">
                <pre className="font-body whitespace-pre-wrap">{review}</pre>
              </div>
            )}
            {!isPending && !review && (
               <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-8">
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
  const editorContent = useMemo(() => {
    if (!selectedFile) {
      return (
        <div className="flex h-full items-center justify-center bg-background text-muted-foreground">
          <p>Select a file to begin</p>
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
      <div className="grid grid-cols-1 lg:grid-cols-2 h-full">
          <div className="h-full flex flex-col relative">
              <ScrollArea className="h-full flex-1">
                  <pre className={cn("font-code text-sm p-4 h-full", 
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-md")}>
                      <code>{selectedFile.content}</code>
                  </pre>
              </ScrollArea>
          </div>
          <div className="h-full hidden lg:block">
            <ReviewPanel file={selectedFile} />
          </div>
      </div>
    );
  }, [selectedFile]);

  return editorContent;
}
