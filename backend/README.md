# Orbit — Backend (Sprint 1)

## Stack
- Node.js + Express
- MongoDB (Mongoose)
- PostgreSQL via `pg` (raw driver, no Prisma)
- JWT + Google OAuth (Passport.js)

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
```
Fill in your actual values in `.env`:
- `MONGO_URI` — from MongoDB Atlas
- `PG_HOST`, `PG_PASSWORD` etc. — from Supabase
- `JWT_SECRET` — generate with `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`
- `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` — from Google Cloud Console

### 3. Run development server
```bash
npm run dev
```

### 4. Verify
Hit `http://localhost:5000/health` — should return `{ "success": true }`

## Folder Structure
```
orbit-backend/
├── config/
│   ├── db.mongo.js        MongoDB connection
│   ├── db.postgres.js     PostgreSQL connection (raw pg)
│   └── passport.js        Google OAuth strategy
├── controllers/
│   └── auth.controller.js register, login, google callback, getMe
├── middleware/
│   ├── auth.middleware.js  protect + authorize
│   ├── error.middleware.js global error handler
│   └── rateLimit.middleware.js
├── models/
│   └── mongo/
│       └── User.model.js
├── routes/
│   ├── auth.routes.js
│   ├── cp.routes.js        (Sprint 2)
│   ├── ai.routes.js        (Sprint 2)
│   ├── scheduler.routes.js (Sprint 2)
│   └── marketplace.routes.js (Sprint 3)
├── utils/
│   ├── jwt.utils.js
│   └── asyncHandler.js
├── index.js
├── .env.example
└── package.json
```

## API Endpoints (Sprint 1)
| Method | Route | Access | Description |
|--------|-------|--------|-------------|
| POST | /api/auth/register | Public | Register with email + password |
| POST | /api/auth/login | Public | Login, get JWT |
| GET | /api/auth/google | Public | Redirect to Google OAuth |
| GET | /api/auth/google/callback | Public | Google redirects here |
| GET | /api/auth/me | Private | Get logged-in user |
| GET | /health | Public | Server health check |
