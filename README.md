# Learnza — AP Exam Prep Platform

A modern practice platform for AP exam preparation with intelligent session tracking, detailed analytics, and course-specific performance insights.

## Overview

Learnza helps AP students ace their exams with organized, data-driven practice sessions across 6 AP courses: AP World History, AP Biology, AP Chemistry, AP European History, AP Precalculus, and AP Macroeconomics.

## Technology Stack

- **Framework**: Next.js 16
- **UI Components**: shadcn/ui with Tailwind CSS v4
- **Auth & Storage**: Firebase Auth + Firestore + Firebase Analytics
- **State Management**: React hooks

## AP Courses

| Course | ID |
|---|---|
| AP World History | `ap-world` |
| AP Biology | `ap-bio` |
| AP Chemistry | `ap-chem` |
| AP European History | `ap-euro` |
| AP Precalculus | `ap-precalc` |
| AP Macroeconomics | `ap-macro` |

## Key Features

- Firebase Auth (email/password + Google Sign-In)
- Firebase Firestore for session storage and user profiles
- Firebase Analytics for usage tracking
- Course-specific practice sessions with real-time feedback and timers
- Redemption queue — missed questions are requeued automatically
- Detailed analytics with per-course accuracy, timing, and session breakdowns
- Bee-yellow design system with dark/light mode

## File Structure

```
/
├── app/
│   ├── page.tsx                    # Public landing page
│   ├── auth/signin/page.tsx        # Sign in
│   ├── auth/signup/page.tsx        # Sign up
│   ├── dashboard/page.tsx          # Stats overview
│   ├── courses/page.tsx            # AP course selection
│   ├── practice/[event]/page.tsx   # Practice session
│   ├── analytics/page.tsx          # Performance analytics
│   ├── layout.tsx                  # Root layout + metadata
│   └── globals.css                 # Theme tokens (bee yellow)
│
├── components/
│   ├── app-sidebar.tsx             # Sidebar navigation
│   ├── auth/auth-provider.tsx      # Firebase auth context
│   ├── auth/auth-guard.tsx         # Route protection
│   └── ui/*                        # shadcn/ui components
│
├── lib/
│   ├── firebase-config.ts          # Firebase app init + analytics
│   ├── firebase-auth-rest.ts       # Auth REST helpers
│   ├── events.ts                   # AP course definitions
│   ├── storage.ts                  # Firestore session utilities
│   └── session-analytics.ts        # Analytics computation helpers
│
└── public/
    └── questions/
        ├── ap-world.json
        ├── ap-bio.json
        ├── ap-chem.json
        ├── ap-euro.json
        ├── ap-precalc.json
        └── ap-macro.json
```

## Adding Questions

Each course has its own JSON file under `/public/questions/<course-id>.json`. Questions follow this format:

```json
{
  "id": "unique-id",
  "question": "Question text here?",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correctAnswer": 0,
  "explanation": "Why the correct answer is correct."
}
```

`correctAnswer` is a zero-based index into the `options` array.

## Firebase Configuration

Firebase is initialized in `/lib/firebase-config.ts`. The project uses:
- **Auth**: Email/password and Google OAuth
- **Firestore**: Session data, user profiles
- **Analytics**: Usage and engagement tracking
- **RTDB**: `learnza-e4704-default-rtdb.firebaseio.com`
