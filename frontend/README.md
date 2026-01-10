# Taulen Frontend

Frontend application for the Taulen digital mortgage origination platform.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **State Management**: Zustand
- **Data Fetching**: React Query (TanStack Query)
- **Forms**: React Hook Form + Zod
- **HTTP Client**: Axios

## Prerequisites

- Node.js 20+
- npm or yarn

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy the example environment file:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your configuration:
```bash
NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1
```

### 3. Run Development Server

```bash
npm run dev
```

The frontend will be available at `http://localhost:3000`

## Project Structure

```
frontend/
├── app/
│   ├── (auth)/          # Authentication pages (login, register)
│   ├── (dashboard)/     # Dashboard and protected pages
│   ├── layout.tsx       # Root layout
│   ├── providers.tsx     # React Query provider
│   └── middleware.ts    # Route protection middleware
├── components/
│   ├── ui/              # shadcn/ui components
│   └── layout/          # Layout components
├── hooks/                # Custom React hooks
├── lib/                  # Utilities and API client
├── store/                # Zustand stores
├── types/                # TypeScript type definitions
└── public/               # Static assets
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Features

- ✅ User authentication (login, register, logout)
- ✅ Protected routes with middleware
- ✅ Dashboard layout
- ✅ API client with interceptors
- ✅ State management with Zustand
- 🔄 URLA Form 1003 (coming soon)
- 🔄 Application management (coming soon)

## API Integration

The frontend connects to the backend API at the URL specified in `NEXT_PUBLIC_API_URL`.

Default: `http://localhost:8080/api/v1`

## Development

The app uses:
- **App Router**: Next.js 14 App Router for routing
- **Server Components**: Default, with client components where needed
- **Middleware**: Route protection and authentication checks
- **React Query**: Data fetching and caching
