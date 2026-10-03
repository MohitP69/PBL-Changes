# Rastasetu Backend
This is a minimal Node + Express backend for the Rastasetu app.

Features:

- User authentication (register / login) with JWT
- Posts CRUD
- Profile read/update

Setup:

1. Copy `.env.example` to `.env` and update values
2. Install dependencies

```bash
cd backend
npm install
npm run dev
```

Database:

- Uses MongoDB. Default connection string is `mongodb://localhost:27017/rastasetu` in `.env.example`.

API endpoints (basic):

- POST /api/auth/register
- POST /api/auth/login
- GET /api/posts
- POST /api/posts (auth)
- GET /api/posts/:id
- PUT /api/posts/:id (auth)
- DELETE /api/posts/:id (auth)
- GET /api/profile (auth)
- PUT /api/profile (auth)
