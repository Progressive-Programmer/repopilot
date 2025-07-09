
// This file is no longer used for the primary data source,
// but is kept for reference or future testing purposes.

export interface File {
  name: string;
  type: 'file';
  content: string;
  language: string;
}

export interface Folder {
  name:string;
  type: 'folder';
  children: (File | Folder)[];
}

export type FileSystemNode = File | Folder;

export interface Repository {
  id: string;
  name: string;
  files: FileSystemNode[];
}

export const repositories: Repository[] = [
  {
    id: 'repo-1',
    name: 'repopilot-website',
    files: [
      {
        name: 'src',
        type: 'folder',
        children: [
          {
            name: 'index.js',
            type: 'file',
            language: 'javascript',
            content: `import React from 'react';
import ReactDOM from 'react-dom';

function App() {
  // A simple function to test the review feature.
  // It has some obvious issues.
  function add(a,b) {
    return a+b
  }
  return <h1>Hello, RepoPilot! Result: {add(2,3)}</h1>;
}

ReactDOM.render(<App />, document.getElementById('root'));`
          },
          {
            name: 'components',
            type: 'folder',
            children: [
              {
                name: 'Button.jsx',
                type: 'file',
                language: 'javascript',
                content: `import React from 'react';

const Button = ({ children, onClick }) => {
    return (
        <button style={{ padding: "10px 20px", borderRadius: "5px", border: "none" }} onClick={onClick}>
            {children}
        </button>
    )
};

export default Button;`
              }
            ]
          }
        ]
      },
      {
        name: 'package.json',
        type: 'file',
        language: 'json',
        content: `{
  "name": "repopilot-website",
  "version": "1.0.0",
  "dependencies": {
    "react": "^18.0.0"
  }
}`
      }
    ]
  },
  {
    id: 'repo-2',
    name: 'backend-api',
    files: [
      {
        name: 'app.py',
        type: 'file',
        language: 'python',
        content: `from flask import Flask
import os

app = Flask(__name__)

@app.route('/')
def hello_world():
    # This is not a secure way to get user data
    user = os.environ.get("USER")
    return 'Hello, {}!'.format(user)

if __name__ == "__main__":
    app.run(debug=True)
`
      },
      {
        name: 'README.md',
        type: 'file',
        language: 'markdown',
        content: `# Backend API
A simple Flask server.`
      }
    ]
  }
];
