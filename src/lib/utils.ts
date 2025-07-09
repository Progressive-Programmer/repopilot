import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getLanguageFromExtension(extension: string): string {
  switch (extension.toLowerCase()) {
    case 'js':
    case 'jsx':
      return 'javascript';
    case 'ts':
    case 'tsx':
      return 'typescript';
    case 'py':
      return 'python';
    case 'java':
      return 'java';
    case 'kt':
    case 'kts':
      return 'kotlin';
    case 'swift':
        return 'swift';
    case 'rb':
      return 'ruby';
    case 'php':
      return 'php';
    case 'go':
      return 'go';
    case 'rs':
      return 'rust';
    case 'c':
    case 'h':
      return 'c';
    case 'cpp':
    case 'hpp':
    case 'cxx':
      return 'cpp';
    case 'cs':
      return 'csharp';
    case 'html':
      return 'html';
    case 'css':
      return 'css';
    case 'scss':
    case 'sass':
      return 'scss';
    case 'json':
      return 'json';
    case 'xml':
      return 'xml';
    case 'md':
      return 'markdown';
    case 'sh':
      return 'shell';
    case 'yaml':
    case 'yml':
      return 'yaml';
    case 'dockerfile':
      return 'dockerfile';
    default:
      return 'plaintext';
  }
}
