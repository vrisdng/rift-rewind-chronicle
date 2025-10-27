# Rift Rewind: League of Legends Year-in-Review

## Project Overview

This is a full-stack application that creates personalized "Spotify Wrapped" style year-in-review experiences for League of Legends players. It is a TypeScript monorepo-style project with a React frontend and a Node.js backend.

- **Frontend**: The frontend is a React application built with Vite. It uses Tailwind CSS for styling and shadcn/ui for components. Charts are rendered using Recharts.
- **Backend**: The backend is a Node.js application using Express. It is written in TypeScript and run with `tsx`. It communicates with the Riot Games API and AWS Bedrock for AI-powered insights.
- **Database**: The project uses Supabase (PostgreSQL) for data caching and storage.

## Building and Running

### Prerequisites

- Node.js and npm
- Bun (optional, but `bun.lockb` exists)

### Environment Setup

1.  **Root `.env` file**: Create a `.env` file in the project root by copying `.env.example`. This file contains environment variables for the frontend.

    ```sh
    cp .env.example .env
    ```

    **`.env` variables:**
    ```
    VITE_API_URL=http://localhost:3000
    VITE_SUPABASE_URL=your_supabase_project_url
    VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
    ```

2.  **Server `.env` file**: Create a `.env` file in the `server` directory by copying `server/.env.example`. This file contains environment variables for the backend.

    ```sh
    cp server/.env.example server/.env
    ```

    **`server/.env` variables:**
    ```
    RIOT_API_KEY=your_riot_api_key
    SUPABASE_URL=your_supabase_url
    SUPABASE_SERVICE_KEY=your_supabase_service_key
    AWS_REGION=us-east-1
    AWS_ACCESS_KEY_ID=your_aws_access_key
    AWS_SECRET_ACCESS_KEY=your_aws_secret_key
    PORT=3000
    ```

### Installation

Install dependencies for both the root and `server` packages:

```sh
npm install
npm install --prefix server
```

### Running the Application

To start both the frontend and backend development servers concurrently, run the following command from the project root:

```sh
npm run dev
```

The frontend will be available at `http://localhost:8080` and the backend at `http://localhost:3000`.

### Building for Production

To build the frontend for production:

```sh
npm run build
```

To compile the backend TypeScript code:

```sh
npm run --prefix server build
```

## Development Conventions

- **Linting**: The project uses ESLint for code quality. To run the linter, use:
  ```sh
  npm run lint
  ```
- **Structure**: The project is organized into two main parts:
  - `src`: Contains the React frontend application.
  - `server`: Contains the Node.js backend application.
- **Styling**: Tailwind CSS is used for styling, with `tailwind.config.ts` for configuration.
- **Components**: Reusable UI components are located in `src/components/ui`.
- **API**: Backend API endpoints are defined in `server/index.ts`. The frontend proxies requests from `/api` to the backend running on `localhost:3000`, as configured in `vite.config.ts`.
