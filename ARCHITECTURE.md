# Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client (Browser)                         │
├─────────────────────────────────────────────────────────────────┤
│  Next.js App                                                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │   Pages     │  │   Hooks     │  │ Components  │              │
│  │  - /        │  │ useTyping   │  │ TypingBoard │              │
│  │  - /typer-  │  │   Game      │  │ Results     │              │
│  │    racer    │  │ useKeyPress │  │ ToggleBtn   │              │
│  └──────┬──────┘  └──────┬──────┘  └─────────────┘              │
│         │                │                                       │
│         └────────────────┼───────────────────────────────────────┤
│                          │                                       │
│  ┌───────────────────────▼───────────────────────────────────┐  │
│  │                    Convex Client                           │  │
│  │              (Real-time subscriptions)                     │  │
│  └───────────────────────┬───────────────────────────────────┘  │
└──────────────────────────┼───────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│                      Convex Backend                               │
├──────────────────────────────────────────────────────────────────┤
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐     │
│  │    Queries     │  │   Mutations    │  │    Schema      │     │
│  │  getCorpus     │  │  createUser    │  │  corpus        │     │
│  │  getLeaderboard│  │  updateScores  │  │  leaderboard   │     │
│  └────────────────┘  └────────────────┘  └────────────────┘     │
└──────────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│                        Clerk Auth                                 │
│              (Google SSO, Session Management)                     │
└──────────────────────────────────────────────────────────────────┘
```

## Data Flow

### 1. Game Start Flow
```
User lands on / → Clicks "Race Me" → Redirected to /typer-racer
                                            │
                                            ▼
                                    Clerk Auth Check
                                            │
                            ┌───────────────┴───────────────┐
                            │                               │
                      Authenticated                   Not Authenticated
                            │                               │
                            ▼                               ▼
                    Load game page                   Redirect to /
```

### 2. Typing Game Flow
```
Corpus loaded from Convex
         │
         ▼
User types first character → Timer starts (30s)
         │
         ▼
Each keypress:
├── Correct char → Advance position, update char count
└── Wrong char   → Show red highlight, increment error count
         │
         ▼
Every second: Calculate WPM = (chars / 5) / minutes
         │
         ▼
Timer hits 0 → Show results + leaderboard
```

### 3. Score Submission Flow
```
User clicks Submit
         │
         ▼
Client sends gameResult to Convex:
{
  startTime: number,
  endTime: number,
  charsTyped: number,
  corpusLength: number
}
         │
         ▼
Server validates:
├── Duration ~30 seconds
├── charsTyped <= corpusLength
├── WPM <= 250 (human limit)
└── Calculate WPM server-side
         │
         ▼
Store validated score in leaderboard
```

## Database Schema

```typescript
// Convex Schema

// Typing content and pre-recorded WPM
corpus: {
  words: string,           // Text to type
  sagar_wpm: string[],     // WPM at each second
}

// User scores
leaderboard: {
  userId: string,          // Clerk user ID
  username: string,
  email?: string,
  scores: number[],        // All submitted scores
  createdAt: number,
  updatedAt: number,
}
```

## Key Technical Decisions

### Why Convex over Supabase?
- Real-time subscriptions out of the box
- Automatic TypeScript type generation
- Simpler API for this use case
- Better developer experience for small projects

### Why Server-Side WPM Validation?
- Prevents cheating via browser console
- Validates timing and character counts
- Rejects impossible scores (>250 WPM)
- Single source of truth for score calculation

### Why Custom useTypingGame Hook?
- Isolates game logic from UI
- Makes testing easier
- Reduces component complexity
- Reusable if adding new game modes

## Performance Considerations

- Character-by-character rendering optimized with minimal re-renders
- Left-padding technique keeps current character centered
- WPM calculated once per second (not per keystroke)
- Convex subscriptions for real-time leaderboard updates

## Security

- Clerk handles all authentication
- Server-side score validation prevents manipulation
- User IDs from Clerk (not client-provided)
- Protected routes via middleware
