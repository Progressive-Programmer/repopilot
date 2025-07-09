
"use client";

import {
    File,
    FileCode2,
    FileJson,
    FileImage,
    FileText,
    Settings,
    Shield,
    Terminal,
    type LucideProps
} from 'lucide-react';
import type { FC } from 'react';

interface FileIconProps extends LucideProps {
    filename: string;
}

// A simple mapping from file extensions to Lucide icons
const iconMap: Record<string, React.ElementType> = {
    // Code
    js: FileCode2,
    ts: FileCode2,
    jsx: FileCode2,
    tsx: FileCode2,
    html: FileCode2,
    css: FileCode2,
    scss: FileCode2,
    py: FileCode2,
    java: FileCode2,
    rb: FileCode2,
    php: FileCode2,
    go: FileCode2,
    rs: FileCode2,
    c: FileCode2,
    h: FileCode2,
    cpp: FileCode2,
    cs: FileCode2,
    swift: FileCode2,
    kt: FileCode2,
    
    // Data
    json: FileJson,
    jsonc: FileJson,
    
    // Config
    yaml: Settings,
    yml: Settings,
    toml: Settings,
    env: Settings,
    
    // Scripts
    sh: Terminal,
    bash: Terminal,
    zsh: Terminal,

    // Docs
    md: FileText,
    txt: FileText,

    // Security
    lock: Shield,

    // Images
    png: FileImage,
    jpg: FileImage,
    jpeg: FileImage,
    gif: FileImage,
    svg: FileImage,
    webp: FileImage,
    ico: FileImage,
};

// Map full filenames to icons
const filenameMap: Record<string, React.ElementType> = {
    'package.json': FileJson,
    'tsconfig.json': FileJson,
    'next.config.js': Settings,
    'next.config.ts': Settings,
    'tailwind.config.ts': Settings,
    'postcss.config.js': Settings,
    'vite.config.ts': Settings,
    'vite.config.js': Settings,
    'dockerfile': Settings,
    '.gitignore': Shield,
};


export const FileIcon: FC<FileIconProps> = ({ filename, ...props }) => {
    // Check for a full filename match first
    const ExactIcon = filenameMap[filename.toLowerCase()];
    if (ExactIcon) {
        return <ExactIcon {...props} />;
    }

    // Fallback to checking the extension
    const extension = filename.split('.').pop()?.toLowerCase() || '';
    const IconComponent = iconMap[extension] || File;

    return <IconComponent {...props} />;
};

