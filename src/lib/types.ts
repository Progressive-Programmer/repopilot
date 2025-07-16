

export interface Repository {
  id: number;
  name: string;
  full_name: string;
  clone_url: string;
  description: string | null;
  owner: {
    login: string;
  };
  default_branch: string;
  stargazers_count: number;
  forks_count: number;
  watchers_count: number;
  html_url: string;
}

export interface File {
  name: string;
  path: string;
  type: 'file';
  content: string;
  language: string;
  url: string;
  sha: string;
}

export interface Folder {
  name: string;
  path: string;
  type: 'folder';
  children: FileSystemNode[];
  url: string;
  sha: string;
}

export type FileSystemNode = File | Folder;

export interface Suggestion {
  title: string;
  description: string;
  severity: 'Critical' | 'Warning' | 'Improvement' | 'Info';
  lines: string;
  suggestion?: string;
}
