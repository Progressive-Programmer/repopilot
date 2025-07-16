
# RepoPilot: Your AI-Powered Code Review Assistant

RepoPilot is a web application built with Next.js that brings the power of AI to your code review process. It securely connects to your GitHub account, allows you to browse your repositories and files, and generates detailed, actionable code reviews using Google's Gemini models.

This project was bootstrapped with [Firebase Studio](https://firebase.google.com/studio).

![RepoPilot Screenshot](https://storage.googleapis.com/static.invertase.io/repopilot.png)

## Core Features

-   **GitHub Repository Sync**: Authenticate with your GitHub account to fetch and display a list of your repositories.
-   **Codebase Explorer**: A VSCode-like file tree allows you to navigate the file and folder structure of any selected repository.
-   **Monaco-Powered Editor**: View file contents in a familiar and powerful code editor, with syntax highlighting for dozens of languages.
-   **AI-Powered Code Review**: With a single click, generate a comprehensive code review for any file. The AI analyzes the code for best practices, potential bugs, and areas for improvement.
-   **Interactive Suggestions**: Review suggestions are presented in an interactive accordion. For many suggestions, the AI provides a code diff and allows you to apply the change directly to the editor.
-   **Commit to GitHub**: After making changes (either manually or by applying AI suggestions), you can commit them directly back to your GitHub repository from within the app.

## Tech Stack

-   **Framework**: [Next.js](https://nextjs.org/) (App Router)
-   **AI**: [Google Gemini via Genkit](https://firebase.google.com/docs/genkit)
-   **UI**: [React](https://react.dev/), [shadcn/ui](https://ui.shadcn.com/), [Tailwind CSS](https://tailwindcss.com/)
-   **Authentication**: [NextAuth.js](https://next-auth.js.org/) (with GitHub Provider)
-   **Code Editor**: [Monaco Editor](https://microsoft.github.io/monaco-editor/)

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

-   Node.js (v18 or later)
-   npm, pnpm, or yarn
-   A GitHub account
-   A Google AI API Key

### Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/repopilot.git
    cd repopilot
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up environment variables:**
    Create a `.env` file in the root of your project and add the following variables. You can use the `.env.example` file as a template.

    ```env
    # GitHub OAuth App credentials
    # Go to GitHub -> Settings -> Developer settings -> OAuth Apps -> New OAuth App
    GITHUB_ID=your_github_client_id
    GITHUB_SECRET=your_github_client_secret

    # NextAuth secret
    # You can generate a secret with: openssl rand -base64 32
    NEXTAUTH_SECRET=your_nextauth_secret
    NEXTAUTH_URL=http://localhost:3000

    # Google AI API Key
    # Go to https://aistudio.google.com/app/apikey
    GOOGLE_API_KEY=your_google_api_key
    ```

4.  **Run the development server:**
    The application requires two concurrent processes: the Next.js frontend and the Genkit AI backend.

    -   **In your first terminal, run the Genkit development server:**
        ```bash
        npm run genkit:watch
        ```
        This will start the Genkit development UI, typically on `http://localhost:4000`.

    -   **In your second terminal, run the Next.js development server:**
        ```bash
        npm run dev
        ```

5.  **Open the application:**
    Navigate to [http://localhost:3000](http://localhost:3000) in your browser. You should be prompted to sign in with GitHub.

## Project Structure

Here's a brief overview of the key directories and files:

```
.
├── src
│   ├── app                 # Next.js App Router: pages, layouts, and API routes
│   │   ├── api             # API routes (GitHub proxy, NextAuth)
│   │   ├── view            # Dynamic route for viewing a repository
│   │   ├── globals.css     # Global styles and Tailwind directives
│   │   ├── layout.tsx      # Root layout component
│   │   └── page.tsx        # Homepage / Repository Dashboard
│   │
│   ├── ai                  # AI-related logic (Genkit)
│   │   ├── flows           # Genkit flows (e.g., generateCodeReview)
│   │   └── genkit.ts       # Genkit configuration
│   │
│   ├── components          # Reusable React components
│   │   ├── ui              # Core UI components from shadcn/ui
│   │   └── *.tsx           # Application-specific components (Editor, RepoExplorer, etc.)
│   │
│   ├── hooks               # Custom React hooks (e.g., useToast)
│   │
│   └── lib                 # Utility functions, types, and constants
│       ├── types.ts        # TypeScript type definitions
│       └── utils.ts        # General utility functions
│
├── public                  # Static assets (images, fonts)
├── next.config.ts          # Next.js configuration
├── tailwind.config.ts      # Tailwind CSS configuration
└── README.md               # This file
```

---

This project aims to demonstrate a practical application of integrating a large language model into a modern web stack to create a powerful developer tool.
