
"use client";

import {
    Folder as FolderIcon,
    File as FileIconDefault,
    type LucideProps
} from 'lucide-react';
import type { FC } from 'react';
import { cn } from '@/lib/utils';

// Custom colorful SVG icons inspired by VS Code
const icons: Record<string, React.ReactNode> = {
  js: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M0 0H24V24H0V0Z" fill="#F7DF1E"/><path d="M8.25391 18.0195L11.168 18.2344C13.4336 18.4297 14.543 17.8281 15.2031 16.7188C15.7969 15.7031 15.9062 14.4531 15.9062 13.3984C15.9062 12.0195 15.543 10.9102 14.7773 10.0547C14.0117 9.19922 13.0117 8.77734 11.668 8.77734C10.457 8.77734 9.47266 9.13672 8.87109 9.94922C8.28711 10.7422 8.03906 11.7773 8.03906 12.8711H10.5352C10.5352 12.2227 10.6445 11.75 10.8867 11.4102C11.1289 11.0703 11.4688 10.8984 11.8281 10.8984C12.2539 10.8984 12.5781 11.0742 12.8086 11.418C13.0391 11.7617 13.1484 12.2969 13.1484 12.9805C13.1484 13.6289 13.0391 14.1289 12.8359 14.5352C12.6328 14.9219 12.2383 15.207 11.5938 15.2891L9.66406 15.5391L8.25391 18.0195ZM9.03125 7.21094C9.28125 6.96094 9.59375 6.84375 9.98828 6.84375C10.3828 6.84375 10.6953 6.96094 10.9453 7.21094C11.1953 7.44141 11.3203 7.73828 11.3203 8.10156C11.3203 8.46484 11.1953 8.76172 10.9453 9C10.6953 9.23828 10.3828 9.36328 9.98828 9.36328C9.59375 9.36328 9.28125 9.23828 9.03125 9C8.79102 8.76172 8.67969 8.46484 8.67969 8.10156C8.67969 7.73828 8.79102 7.44141 9.03125 7.21094Z" fill="black"/></svg>,
  ts: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M0 0H24V24H0V0Z" fill="#3178C6"/><path d="M10.2344 17.5781V8.4375H12.9258L12.9375 10.3125H13.0312C13.2969 9.85156 13.6758 9.46094 14.168 9.14062C14.6797 8.80078 15.2578 8.63281 15.9023 8.63281C16.3281 8.63281 16.6797 8.67969 16.957 8.77344V11.25C16.6055 11.1367 16.2109 11.0781 15.7734 11.0781C15.1523 11.0781 14.6328 11.2539 14.2148 11.6055C13.8164 11.9375 13.5508 12.4336 13.418 13.0938V17.5781H10.2344ZM18.9922 7.17188C19.2656 6.92188 19.5938 6.79688 19.9766 6.79688C20.3594 6.79688 20.6875 6.92188 20.9609 7.17188C21.2344 7.42188 21.3711 7.73438 21.3711 8.10938C21.3711 8.46484 21.2344 8.76172 20.9609 8.99219C20.6875 9.22266 20.3594 9.34375 19.9766 9.34375C19.5938 9.34375 19.2656 9.22266 18.9922 8.99219C18.7383 8.76172 18.6055 8.46484 18.6055 8.10938C18.6055 7.73438 18.7383 7.42188 18.9922 7.17188Z" fill="white"/></svg>,
  html: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g clip-path="url(#clip0_105_2)"><path d="M4 2L2 20L12 23L22 20L20 2H4ZM18.5 18.5L12 20.3L5.5 18.5L4.5 4H19.5L18.5 18.5Z" fill="#E34F26"/><path d="M12 5.5V19.2L17.5 17.8L18.2 5.5H12Z" fill="#F16529"/><path d="M12 12.5H15.5L15.2 15.8L12 16.6V12.5Z" fill="#EBEBEB"/><path d="M12 8.5H16L16.2 6.5H12V8.5Z" fill="#EBEBEB"/><path d="M12 12.5V16.6L8.8 15.8L8.5 12.5H12Z" fill="white"/><path d="M12 8.5V6.5H7.8L7.5 8.5H12Z" fill="white"/></g><defs><clipPath id="clip0_105_2"><rect width="24" height="24" fill="white"/></clipPath></defs></svg>,
  css: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g clip-path="url(#clip0_105_13)"><path d="M4 2L2 20L12 23L22 20L20 2H4ZM18.5 18.5L12 20.3L5.5 18.5L4.5 4H19.5L18.5 18.5Z" fill="#1572B6"/><path d="M12 5.5V19.2L17.5 17.8L18.2 5.5H12Z" fill="#33A9DC"/><path d="M12 12.5H15.2L14.9 15.8L12 16.6V12.5Z" fill="#EBEBEB"/><path d="M12 8.5H15.7L15.9 6.5H12V8.5Z" fill="#EBEBEB"/><path d="M12 12.5V16.6L8.8 15.8L8.5 12.5H12Z" fill="white"/><path d="M12 8.5V6.5H7.8L7.5 8.5H12Z" fill="white"/></g><defs><clipPath id="clip0_105_13"><rect width="24" height="24" fill="white"/></clipPath></defs></svg>,
  json: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M17.5 4H6.5C5.39 4 4.5 4.9 4.5 6V18C4.5 19.1 5.39 20 6.5 20H17.5C18.61 20 19.5 19.1 19.5 18V6C19.5 4.9 18.61 4 17.5 4Z" fill="#fbc02d"/><path d="M10 16.5C8.62 16.5 7.5 15.38 7.5 14C7.5 12.62 8.62 11.5 10 11.5C10.74 11.5 11.39 11.81 11.83 12.26C11.64 12.87 11.1 13.58 10.3 13.58C9.55 13.58 9 13.06 9 12.18C9 11.45 9.47 10.92 10.15 10.92C10.74 10.92 11.13 11.27 11.33 11.66C11.84 10.83 12.82 10 14 10C15.38 10 16.5 11.12 16.5 12.5C16.5 13.88 15.38 15 14 15C13.26 15 12.61 14.69 12.17 14.24C12.36 13.63 12.9 12.92 13.7 12.92C14.45 12.92 15 13.44 15 14.32C15 15.05 14.53 15.58 13.85 15.58C13.26 15.58 12.87 15.23 12.67 14.84C12.16 15.67 11.18 16.5 10 16.5Z" fill="black" fill-opacity="0.6"/></svg>,
  md: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="3" width="18" height="18" rx="2" fill="#0096D8"/><path d="M7 17V7H9L11 9L13 7H15V17H13V10L11 12L9 10V17H7ZM18 11H16V7H18V11Z" fill="white"/></svg>,
  py: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M22 10.5V11C22 14.87 18.87 18 15 18H12V22H11.5C7.63 22 4.5 18.87 4.5 15V12H2V11.5C2 7.63 5.13 4.5 9 4.5H12V2H12.5C16.37 2 19.5 5.13 19.5 9V12H22V10.5Z" fill="#306998"/><path d="M18 9C18 5.13 14.87 2 11 2H9V4.5H11.5C14.87 4.5 18 7.63 18 11.5V12H19.5V9H18Z" fill="#FFD43B"/><path d="M12 15C12 18.87 8.87 22 5 22H4.5V19.5H5C8.37 19.5 11.5 16.37 11.5 12.5V12H12V15Z" fill="#306998"/></svg>,
  config: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M19.14 12.94C19.03 12.44 18.94 11.95 18.86 11.45L21.05 9.79L19.23 6.7L16.5 7.82C15.86 7.33 15.15 6.94 14.38 6.64L13.92 3.8H10.08L9.62 6.64C8.85 6.94 8.14 7.33 7.5 7.82L4.77 6.7L2.95 9.79L5.14 11.45C5.06 11.95 4.97 12.44 4.86 12.94L2 14L4 17.5L6.64 16.14C7.23 16.63 7.88 17.05 8.59 17.39L8.98 20.2H12.82L13.21 17.39C13.92 17.05 14.57 16.63 15.16 16.14L17.8 17.5L19.8 14L19.14 12.94ZM12 15.5C10.07 15.5 8.5 13.93 8.5 12C8.5 10.07 10.07 8.5 12 8.5C13.93 8.5 15.5 10.07 15.5 12C15.5 13.93 13.93 15.5 12 15.5Z" fill="#607D8B"/></svg>,
  npm: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 4H4C3.44772 4 3 4.44772 3 5V19C3 19.5523 3.44772 20 4 20H20C20.5523 20 21 19.5523 21 19V5C21 4.44772 20.5523 4 20 4Z" fill="#CB3837"/><path d="M18 6H6V14H9V10H11V14H14V8H16V14H18V6Z" fill="white"/></svg>,
  image: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21 19V5C21 3.9 20.1 3 19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19ZM8.5 13.5L11 16.51L14.5 12L19 18H5L8.5 13.5Z" fill="#4CAF50"/></svg>,
  lock: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 17C12.55 17 13 16.55 13 16C13 15.45 12.55 15 12 15C11.45 15 11 15.45 11 16C11 16.55 11.45 17 12 17ZM18 8H17V6C17 3.24 14.76 1 12 1C9.24 1 7 3.24 7 6V8H6C4.9 8 4 8.9 4 10V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V10C20 8.9 19.1 8 18 8ZM9 6C9 4.34 10.34 3 12 3C13.66 3 15 4.34 15 6V8H9V6Z" fill="#78909C"/></svg>,
  readme: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M14 2H6C4.89 2 4 2.9 4 4V20C4 21.1 4.89 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2ZM12 19C10.34 19 9 17.66 9 16C9 14.34 10.34 13 12 13C13.66 13 15 14.34 15 16C15 17.66 13.66 19 12 19ZM15 9H5V5H15V9Z" fill="#03A9F4"/></svg>,
  tailwind: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 18C15.3137 18 18 15.3137 18 12C18 8.68629 15.3137 6 12 6C8.68629 6 6 8.68629 6 12C6 15.3137 8.68629 18 12 18Z" fill="#38BDF8"/><path d="M12 12C13.6569 12 15 10.6569 15 9C15 7.34315 13.6569 6 12 6C10.3431 6 9 7.34315 9 9C9 10.6569 10.3431 12 12 12Z" fill="#38BDF8"/><path d="M16.5 12C18.433 12 20 10.433 20 8.5C20 6.567 18.433 5 16.5 5C14.567 5 13 6.567 13 8.5C13 10.433 14.567 12 16.5 12Z" fill-opacity="0" /><path d="M7.5 12C9.433 12 11 10.433 11 8.5C11 6.567 9.433 5 7.5 5C5.567 5 4 6.567 4 8.5C4 10.433 5.567 12 7.5 12Z" fill-opacity="0" /><path d="M12 18C15.3137 18 18 15.3137 18 12C18 8.68629 15.3137 6 12 6C8.68629 6 6 8.68629 6 12C6 15.3137 8.68629 18 12 18Z" fill="#38BDF8"/><path d="M12.0125 12.75C10.7812 12.75 9.75 11.7188 9.75 10.5C9.75 9.28125 10.7812 8.25 12.0125 8.25C13.2312 8.25 14.25 9.28125 14.25 10.5C14.25 11.7188 13.2312 12.75 12.0125 12.75ZM7.5125 12.75C6.28125 12.75 5.25 11.7188 5.25 10.5C5.25 9.28125 6.28125 8.25 7.5125 8.25C8.73125 8.25 9.75 9.28125 9.75 10.5C9.75 11.7188 8.73125 12.75 7.5125 12.75Z" fill="#0F172A"/></svg>,
  next: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="11" fill="black"/><path d="M13.7582 7.625H12.395V16.375H13.7582V12.1641L16.2996 16.375H18.2312L15.2285 11.4141L18.4988 7.625H16.4957L14.4926 10.5L13.7582 9.42969V7.625ZM8.5 7.625H7V16.375H8.5V7.625Z" fill="white"/></svg>,
  gitignore: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M18.4 6.6L19.4 5.6C18.8 5 18 4.5 17.2 4.1L16.8 5.2C17.4 5.5 17.9 5.9 18.4 6.6ZM5.6 18.4L4.6 19.4C5.2 20 6 20.5 6.8 20.9L7.2 19.8C6.6 19.5 6.1 19.1 5.6 18.4ZM19.8 7.2L20.9 6.8C20.5 6 20 5.2 19.4 4.6L18.4 5.6C19.1 6.1 19.5 6.6 19.8 7.2ZM4.1 17.2L3.1 16.8C3.5 16 4 5.2 4.6 4.6L5.6 5.6C4.9 6.1 4.5 6.6 4.1 7.2ZM21.9 12H23.5C23.5 7.9 20.1 4.5 16 4.5V3C12 3 8.3 5.5 6.3 9H9.2L5.2 13L1.2 9H4C5.5 6.5 8.5 4.9 11.9 4.9C15.5 4.9 18.5 7.2 19.6 10.5H16.8L21.9 12ZM19 15L22.8 15L18.8 19H20C18.5 21.5 15.5 23.1 12.1 23.1C8.5 23.1 5.5 20.8 4.4 17.5H7.2L2.1 16H0.5C0.5 20.1 3.9 23.5 8 23.5V25C12 25 15.7 22.5 17.7 19H14.8L19 15Z" fill="#F4511E" transform="rotate(-45 12 12)"/></svg>,
  yaml: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="4" y="4" width="16" height="16" rx="2" fill="#4CAF50"/><path d="M12 6L7 11H10V14H14V11H17L12 6Z" fill="white"/></svg>,
  docker: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M22.12 9.42C21.75 6.15 19.08 3.73 15.75 3.73H8.25C4.92 3.73 2.25 6.15 1.88 9.42C1.06 9.57 0.75 10.41 0.75 11.25V12.75C0.75 13.59 1.06 14.43 1.88 14.58C2.25 17.85 4.92 20.27 8.25 20.27H15.75C19.08 20.27 21.75 17.85 22.12 14.58C22.94 14.43 23.25 13.59 23.25 12.75V11.25C23.25 10.41 22.94 9.57 22.12 9.42ZM6 11.25H4.5V9.75H6V11.25ZM9 11.25H7.5V9.75H9V11.25ZM9 8.25H7.5V6.75H9V8.25ZM12 11.25H10.5V9.75H12V11.25ZM12 8.25H10.5V6.75H12V8.25ZM15 11.25H13.5V9.75H15V11.25ZM15 8.25H13.5V6.75H15V8.25Z" fill="#2196F3"/></svg>,
};


interface FileIconProps extends Omit<LucideProps, 'color' | 'strokeWidth' | 'fill' > {
    filename: string;
}

// A simple mapping from file extensions to our custom icons
const iconMap: Record<string, React.ReactNode> = {
    // Code
    js: icons.js,
    jsx: icons.js,
    ts: icons.ts,
    tsx: icons.ts,
    html: icons.html,
    css: icons.css,
    scss: icons.css,
    py: icons.py,
    
    // Data
    json: icons.json,
    
    // Config
    yaml: icons.yaml,
    yml: icons.yaml,
    
    // Docs
    md: icons.readme,
    
    // Images
    png: icons.image,
    jpg: icons.image,
    jpeg: icons.image,
    gif: icons.image,
    svg: icons.image,
    webp: icons.image,
    ico: icons.image,

    // Lock files
    lock: icons.lock,
};

// Map full filenames to icons
const filenameMap: Record<string, React.ReactNode> = {
    'package.json': icons.npm,
    'package-lock.json': icons.npm,
    'pnpm-lock.yaml': icons.lock,
    'yarn.lock': icons.lock,
    'next.config.js': icons.next,
    'next.config.mjs': icons.next,
    'next.config.ts': icons.next,
    'tailwind.config.js': icons.tailwind,
    'tailwind.config.mjs': icons.tailwind,
    'tailwind.config.ts': icons.tailwind,
    'postcss.config.js': icons.config,
    'postcss.config.mjs': icons.config,
    'vite.config.js': icons.config,
    'vite.config.ts': icons.config,
    'tsconfig.json': icons.ts,
    'jsconfig.json': icons.js,
    '.gitignore': icons.gitignore,
    'dockerfile': icons.docker,
    'readme.md': icons.readme,
};

const IconWrapper: FC<{ children: React.ReactNode, className?: string }> = ({ children, className }) => {
    return (
        <div className={cn("h-4 w-4 shrink-0", className)}>
            {children}
        </div>
    );
};


export const FileIcon: FC<FileIconProps> = ({ filename, className, ...props }) => {
    const lowerFilename = filename.toLowerCase();

    // Check for a full filename match first
    const ExactIcon = filenameMap[lowerFilename];
    if (ExactIcon) {
        return <IconWrapper className={className}>{ExactIcon}</IconWrapper>;
    }

    // Fallback to checking the extension
    const extension = lowerFilename.split('.').pop() || '';
    const IconComponent = iconMap[extension];
    if (IconComponent) {
        return <IconWrapper className={className}>{IconComponent}</IconWrapper>;
    }

    return <FileIconDefault className={cn("h-4 w-4 text-foreground/60", className)} {...props} />;
};
