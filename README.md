# AI Financial Report Analyzer

A production-ready full-stack application for uploading financial reports, running RAG-powered analysis, extracting metrics and risks, chatting with source citations, and visualizing investor dashboards.

## Stack

- Frontend: React, Tailwind CSS, React Router, Axios, Recharts
- Backend: Node.js, Express, JWT, bcrypt, Multer, LangChain/LangGraph-ready services
- Database: MongoDB Atlas
- Vector DB: ChromaDB Cloud-compatible REST client
- AI: OpenAI GPT-4o or Gemini
- Deployment: Vercel frontend, Render backend

## Quick Start

1. Install dependencies:
   ```bash
   npm run install:all
   ```
2. Copy environment files:
   ```bash
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   ```
3. Fill MongoDB Atlas, ChromaDB, JWT, and LLM keys.
4. Run locally:
   ```bash
   npm run dev
   ```

## API Overview

- `POST /api/auth/register` register
- `POST /api/auth/login` login
- `POST /api/auth/refresh` refresh access token
- `POST /api/auth/logout` logout
- `GET /api/users/me` profile
- `POST /api/documents` upload PDF
- `GET /api/documents` list user documents
- `GET /api/documents/:id` document detail
- `POST /api/chat/:documentId` RAG chat
- `POST /api/analysis/:documentId/run` run full investor analysis
- `GET /api/analysis/:documentId` analysis result
- `GET /api/dashboard/:documentId` dashboard data
- `POST /api/evaluations/:documentId` RAG evaluation
- `GET /api/audit` admin audit log

## Deployment

### Backend on Render

- Root directory: `backend`
- Build command: `npm install`
- Start command: `npm start`
- Add environment variables from `backend/.env.example`

### Frontend on Vercel

- Root directory: `frontend`
- Build command: `npm run build`
- Output directory: `dist`
- Add `VITE_API_URL` pointing to Render backend URL

## Security

Includes JWT access/refresh tokens, bcrypt password hashing, RBAC, rate limiting, Helmet, CORS allowlist, XSS sanitization, NoSQL injection sanitization, CSRF protection hook, secure file validation, audit logging, account lockout, password policy, and user document isolation.
