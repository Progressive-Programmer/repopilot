
"use client";

import { useSession, signOut } from "next-auth/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Github, LifeBuoy, LogOut, Settings, User, LogIn } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import Link from 'next/link';

export function GithubUI() {
  const { data: session, status } = useSession();

  if (status === "unauthenticated") {
    return (
      <Button onClick={() => signIn("github")}>
        <LogIn className="mr-2 h-4 w-4" />
        Sign in with GitHub
      </Button>
    );
  }

  if (status === "authenticated" && session?.user) {
    const githubUsername = (session as any).user?.name;
    const githubProfileUrl = `https://github.com/${githubUsername}`;

    return (
      <div className="flex items-center gap-4">
        <ThemeToggle />
        <Button variant="ghost" size="icon" asChild>
          <a href="https://github.com/invertase/repopilot" target="_blank" aria-label="GitHub Repository">
            <Github className="h-5 w-5" />
          </a>
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full">
              <Avatar className="h-9 w-9">
                <AvatarImage src={session.user.image ?? ""} alt={session.user.name ?? "User avatar"} data-ai-hint="avatar user" />
                <AvatarFallback>{session.user.name?.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{session.user.name}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {session.user.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <a href={githubProfileUrl} target="_blank" rel="noopener noreferrer">
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </a>
            </DropdownMenuItem>
            
            <DropdownMenuItem asChild>
              <Link href="/settings">
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <a href="https://github.com/invertase/repopilot/issues" target="_blank" rel="noopener noreferrer">
                <LifeBuoy className="mr-2 h-4 w-4" />
                <span>Support</span>
              </a>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => signOut()}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }

  return null;
}
