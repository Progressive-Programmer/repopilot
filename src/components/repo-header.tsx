
"use client";

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { GitFork, Star, Share2, Loader2, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Repository } from '@/lib/types';
import { Skeleton } from './ui/skeleton';

async function fetchRepoDetails(repoFullName: string): Promise<Repository | null> {
    try {
        const res = await fetch(`/api/github/repos/${repoFullName}`);
        if (!res.ok) {
            console.error(`Failed to fetch repository details for ${repoFullName}. Status: ${res.status}`);
            return null;
        }
        const { data } = await res.json();
        return data;
    } catch (error) {
        console.error("Failed to fetch full repo details", error);
        return null;
    }
}


export const RepoHeader = ({ repoFullName }: { repoFullName: string }) => {
    const { toast } = useToast();
    const [repo, setRepo] = useState<Repository | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadRepo = async () => {
            if (!repoFullName) {
                setLoading(false);
                return;
            }
            setLoading(true);
            const details = await fetchRepoDetails(repoFullName);
            setRepo(details);
            setLoading(false);
        }
        loadRepo();
    }, [repoFullName]);


    const handleShare = () => {
        if (!repo) return;
        navigator.clipboard.writeText(repo.html_url);
        toast({
            title: "Copied to clipboard!",
            description: "Repository URL has been copied to your clipboard.",
        });
    };

    const handleStar = async () => {
        // Note: This is a placeholder for actual star/unstar functionality
        // which would require more API work (checking if starred, PUT/DELETE methods)
        toast({
            title: "Action complete",
            description: "You've starred this repository! (placeholder)",
        });
    };

    if (loading) {
        return <Skeleton className="w-64 h-8 rounded-md" />;
    }
    
    if (!repo) {
        return (
            <div className="flex items-center gap-2 text-sm text-destructive">
                <AlertTriangle className="h-4 w-4" />
                <span>Failed to load repository details.</span>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-4">
            <div className="flex flex-col">
                <a href={repo.html_url} target="_blank" rel="noopener noreferrer" className="text-lg font-semibold hover:underline">
                    {repo.owner.login} / {repo.name}
                </a>
            </div>
            <div className="flex items-center gap-3">
                 <Button variant="outline" size="sm" onClick={handleStar}>
                    <Star className="mr-2 h-4 w-4" />
                    Star
                    <span className="ml-2 rounded-md bg-muted px-1.5 py-0.5 text-xs font-mono">{repo.stargazers_count}</span>
                </Button>
                <Button variant="outline" size="sm" asChild>
                    <a href={`${repo.html_url}/fork`} target="_blank" rel="noopener noreferrer">
                        <GitFork className="mr-2 h-4 w-4" />
                        Fork
                         <span className="ml-2 rounded-md bg-muted px-1.5 py-0.5 text-xs font-mono">{repo.forks_count}</span>
                    </a>
                </Button>
                 <Button variant="ghost" size="icon" onClick={handleShare}>
                    <Share2 className="h-4 w-4" />
                    <span className="sr-only">Share</span>
                </Button>
            </div>
        </div>
    );
}
