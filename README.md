# Typer Racer

A real-time typing speed competition app where you race against pre-recorded WPM data. Built with Next.js, TypeScript, and modern web technologies.

## Features

- 30-second typing challenges with real-time WPM tracking
- Character-by-character validation with visual feedback
- Global leaderboard with persistent scores
- Dark/light theme support
- Mobile-responsive design
- Google SSO authentication

## Tech Stack

| Category      | Technology                                    |
| ------------- | --------------------------------------------- |
| Framework     | [Next.js 14](https://nextjs.org/)             |
| Language      | [TypeScript](https://www.typescriptlang.org/) |
| Styling       | [Tailwind CSS](https://tailwindcss.com/)      |
| Auth          | [Clerk](https://clerk.com/)                   |
| Database      | [Convex](https://www.convex.dev/)             |
| Charts        | [Nivo](https://nivo.rocks/)                   |
| Deployment    | [Vercel](https://vercel.com/)                 |

## Getting Started

### Prerequisites

- Node.js 18+
- Yarn
- Clerk account (for auth)
- Convex account (for database)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/typer-racer.git
cd typer-racer

# Install dependencies
yarn install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Clerk and Convex credentials

# Start the development server
yarn dev
```

### Environment Variables

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
NEXT_PUBLIC_CONVEX_URL=https://...convex.cloud
CONVEX_DEPLOYMENT=dev:...
```

## Project Structure

```
src/
├── components/       # Shared UI components
├── hooks/            # Custom React hooks
├── pages/            # Next.js pages and API routes
│   ├── components/   # Page-specific components
│   └── api/          # API routes
├── lib/              # Utility libraries
├── types/            # TypeScript type definitions
└── styles/           # Global styles

convex/               # Convex backend functions
├── schema.ts         # Database schema
├── corpus.ts         # Typing content queries
└── leaderboard.ts    # Leaderboard mutations/queries
```

## Scripts

```bash
yarn dev          # Start development server (port 9000)
yarn build        # Build for production
yarn start        # Start production server
yarn lint         # Run ESLint
yarn format       # Format code with Prettier
yarn test         # Run unit tests
yarn test:e2e     # Run E2E tests with Playwright
```

## Architecture

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed system design documentation.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## License

MIT
