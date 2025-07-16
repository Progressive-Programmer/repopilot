
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GithubUI } from '@/components/github-ui';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ThemeToggle } from '@/components/theme-toggle';
import { Label } from '@/components/ui/label';

const Logo = () => (
    <div className="flex items-center gap-2">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-primary">
            <path d="M12 2L2 7V17L12 22L22 17V7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M2 7L12 12L22 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M12 22V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <h1 className="text-lg font-semibold font-headline">RepoPilot</h1>
    </div>
);


export default function SettingsPage() {
    return (
        <div className="flex flex-col h-svh bg-background">
            <header className="flex items-center justify-between px-4 border-b h-16 shrink-0">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="sm" asChild>
                       <Link href="/">
                         <ArrowLeft className="mr-2 h-4 w-4" />
                         Back
                       </Link>
                    </Button>
                    <div className='hidden md:block'>
                        <Logo />
                    </div>
                </div>
                <GithubUI />
            </header>
            <main className="flex-1 overflow-auto p-4 md:p-8">
                 <div className="max-w-xl mx-auto">
                    <h1 className="text-2xl font-bold tracking-tight mb-6">Settings</h1>
                    <Card>
                        <CardHeader>
                            <CardTitle>Appearance</CardTitle>
                            <CardDescription>
                                Customize the look and feel of the application.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                           <div className="flex items-center justify-between space-x-2">
                                <Label htmlFor="theme-toggle" className="font-medium">
                                    Interface Theme
                                </Label>
                                <div className="flex items-center gap-2">
                                    <span>Light</span>
                                    <ThemeToggle />
                                    <span>Dark</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                 </div>
            </main>
        </div>
    );
}
