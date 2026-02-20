# EduMind - Agent Coding Guidelines

## Project Overview
- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **Backend**: Python FastAPI + SQLAlchemy + ChromaDB
- **API Prefix**: `/api/v1`
- **WebSocket**: `/api/v1/chat/ws`

---

## Build / Lint / Test Commands

### Frontend (cd frontend/)
| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | TypeScript check + Vite build |
| `npm run lint` | Run ESLint |
| `npm run preview` | Preview production build |

### Backend (cd backend/)
| Command | Description |
|---------|-------------|
| `uvicorn app.main:app --reload` | Start FastAPI server on localhost:8000 |
| `pip install -r requirements.txt` | Install Python dependencies |

### Testing
- **No test framework configured** - Consider adding Vitest (frontend) / pytest (backend)
- To run a single test when configured: `npm test -- --testNamePattern="pattern"` or `pytest -k "pattern"`

---

## Code Style Guidelines

### Frontend (TypeScript / React)

#### Imports
- Use path alias `@/` for src-relative imports: `import X from "@/components/X"`
- Order: React imports → external libs → internal components/utils → styles
```typescript
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
```

#### Formatting
- Use 2-space indentation
- No semicolons at line ends
- Single quotes for strings
- Trailing commas in objects/arrays

#### Types
- **Strict TypeScript enabled** - no `any` without explicit reason
- Use explicit types for props, avoid implicit `any`
- Use `interface` for component props, `type` for unions/complex types

#### Naming Conventions
- **Components**: PascalCase (`Dashboard.tsx`, `VoiceInput.tsx`)
- **Hooks**: camelCase with `use` prefix (`useAuth`, `useWebSocket`)
- **Utils/functions**: camelCase (`getStoredUser`, `authFetch`)
- **Files**: kebab-case for non-component files (`auth.ts`, `utils.ts`)

#### Component Patterns
- Use function components only (no class components)
- Use `cn()` utility from `@/lib/utils` for conditional className merging
- Destructure props with explicit typing
```typescript
interface ButtonProps {
  variant?: 'default' | 'outline';
  children: ReactNode;
}

export function Button({ variant = 'default', children }: ButtonProps) {
  return <button className={cn('base-class', variant === 'outline' && 'outline')}>{children}</button>;
}
```

#### Animations
- Use `framer-motion` for animations (see `@/components/ui/motion.tsx`)
- Pre-built components: `FadeIn`, `SlideUp`, `ScaleIn`, `StaggerContainer`

#### Error Handling
- Use `sonner` toast for user feedback: `toast.success()`, `toast.error()`
- Wrap async operations in try/catch with user feedback
- Log errors to console with context

#### State Management
- Use React Context for global state (`UserContext.tsx`)
- Use local `useState` for component-level state
- Use `useRef` for mutable values that don't trigger re-renders

---

### Backend (Python / FastAPI)

#### Imports
- Standard library → third-party → local app imports
```python
from fastapi import APIRouter, HTTPException
from typing import List, Optional
from pydantic import BaseModel
from app.schemas.schemas import UserCreate
```

#### Naming Conventions
- **Files**: snake_case (`auth.py`, `knowledge_service.py`)
- **Functions/variables**: snake_case (`get_db_session`, `hash_password`)
- **Classes**: PascalCase (`UserCreate`, `KnowledgeItem`)

#### Pydantic Models
- All request/response schemas must use Pydantic `BaseModel`
- Use `Optional[T]` with default `None` for optional fields
- Use `List[T]` for array fields

#### Error Handling
- Raise `HTTPException(status_code=..., detail="...")` for API errors
- Use logger for programmatic errors: `from app.core.logger import logger`

#### Database
- Use `get_db_session()` context manager for DB operations
- Raw SQL queries use `%s` placeholders (not f-strings)

---

## Project Structure

```
EduMind/
├── frontend/
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   │   ├── ui/       # shadcn/ui base components
│   │   │   └── layout/   # Layout components (Sidebar, Layout)
│   │   ├── pages/        # Route pages (Dashboard, Brain, Factory...)
│   │   ├── context/       # React Context providers
│   │   ├── lib/          # Utilities (utils.ts, auth.ts)
│   │   └── types/        # TypeScript type definitions
│   ├── package.json
│   ├── vite.config.ts    # Path alias: @/ -> src/
│   └── tsconfig.app.json # Strict TypeScript enabled
│
└── backend/
    ├── app/
    │   ├── api/v1/       # API endpoints
    │   ├── core/         # Config, database, logging
    │   ├── schemas/      # Pydantic models
    │   └── services/     # Business logic
    ├── requirements.txt
    └── run.py
```

---

## Key Conventions

1. **API Responses**: Always return JSON-serializable Pydantic models
2. **Authentication**: Use `X-User-Id` header for user identification
3. **Static Files**: Served from `/static` mount point (backend/upload/)
4. **Chinese Language**: Project uses Chinese for UI text and comments - Chinese is acceptable
5. **Environment Variables**: 
   - Frontend: `.env` (Vite)
   - Backend: `.env` (python-dotenv)

---

## Adding New Features

### Frontend
1. Create component in appropriate directory under `src/components/`
2. Use existing shadcn/ui components from `@/components/ui/`
3. Add page route in `App.tsx` with `ProtectedRoute` wrapper

### Backend
1. Add endpoint to appropriate file in `app/api/v1/endpoints/`
2. Define request/response schemas in `app/schemas/schemas.py`
3. Register router in `app/api/v1/api.py`

---

## Lint/TypeCheck Before Commit

Run these commands before committing:

```bash
# Frontend
cd frontend && npm run lint && npm run build

# Backend (install ruff for linting)
pip install ruff && ruff check app/
```
