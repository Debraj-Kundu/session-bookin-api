# Session Booking API

REST API where users book sessions with teachers. Node.js, TypeScript, Express 5, MongoDB, Mongoose.

## Run with Docker (recommended)

Requires Docker with Compose v2.

```bash
cp .env.example .env
```

Set `JWT_SECRET` in `.env` to a long random string, then:

```bash
docker compose up --build -d
```

The API listens on `http://localhost:3000`. On every startup it seeds demo data and logs the IDs (`docker compose logs api`). Records that already exist are skipped:

| Data | Seeded | Counts as existing when |
|---|---|---|
| 3 teachers | Asha Rao, Daniel Cho, Maria Lopez | same email |
| 1 user | `test@mail.com` / `Pass@123` | same email |
| 50 AVAILABLE sessions | 16–20 Nov 2026, 10 per day hourly from 08:00 to 17:00 UTC, 1 hour each, spread across the teachers | same teacher and start time |

Session dates are fixed, so restarts never add more.

### Browse the database

MongoDB is exposed on `localhost:27017` (bound to `127.0.0.1`, so not reachable from other machines). Connect [MongoDB Compass](https://www.mongodb.com/products/tools/compass) to `mongodb://localhost:27017/session-booking` to browse the `users`, `teachers` and `sessions` collections. If a local MongoDB already uses port 27017, change the host port in `docker-compose.yml`, e.g. `127.0.0.1:27018:27017`.

## Run locally

Requires Node.js ≥ 20.6 and a MongoDB instance at `MONGODB_URI`.

```bash
cp .env.example .env
npm install
npm run dev
```

Production build: `npm run build && npm start`.

## Environment variables

| Name | Required | Default |
|------|----------|---------|
| `MONGODB_URI` | yes (set by Compose in Docker) | – |
| `JWT_SECRET` | yes | – |
| `PORT` | no | `3000` |
| `COOKIE_SECURE` | no | `true` |

`.env.example` sets `COOKIE_SECURE=false` so the cookie works over plain `http://localhost`. In any deployed environment, serve over HTTPS and leave it `true`.

## Authentication

1. Sign up with `POST /users`.
2. Log in with `POST /auth/login`. The JWT (valid for 1 day) is set as a `token` cookie with `HttpOnly`, `SameSite=Strict` and, when `COOKIE_SECURE` is on, `Secure`. It is never returned in the response body, so page scripts cannot read it.
3. Clients send the cookie automatically on later requests.
4. `POST /auth/logout` clears the cookie.

The acting user is always taken from the token, never from the request body.

## Project structure

```
src/
  config.ts        environment variables
  app.ts           express app, routes, global 404 and error middleware
  server.ts        database connection and listen
  seed.ts          demo teachers, test user and sessions, run on startup
  models/          mongoose schemas
  routes/          URL → middleware → controller wiring
  controllers/     read the request, call a service, send the response
  services/        business rules and database access
  middlewares/     auth (cookie → req.userId), content negotiation + 405, global error handler
  utils/           HttpError, pagination
```

## Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/users` | – | Sign up `{ fullName, email, phone, password }` → 201 + `Location: /users/:id` |
| GET | `/users/:id` | ✓ | Your own user |
| POST | `/auth/login` | – | `{ email, password }` → `{ user }` + auth cookie |
| POST | `/auth/logout` | – | Clears the auth cookie (204) |
| POST | `/sessions` | ✓ | Create a session `{ teacherId, startTime, endTime }` → 201 + `Location: /sessions/:id` |
| GET | `/sessions/:id` | ✓ | One session |
| GET | `/sessions/available?dateTimestamp=2026-11-18&page=&limit=` | ✓ | AVAILABLE sessions on that UTC day |
| POST | `/sessions/:id/book` | ✓ | Book an AVAILABLE session |
| POST | `/sessions/:id/cancel` | ✓ | Cancel your booking (back to AVAILABLE) |
| PATCH | `/sessions/:id/complete` | ✓ | Mark your BOOKED session COMPLETED |
| GET | `/users/:id/sessions?page=&limit=` | ✓ | Your sessions as `{ upcoming, completed }` |

Paginated responses: `{ items, page, limit, total, totalPages }`. `page` starts at 1 (default 1), `limit` defaults to 20 (max 100). A page past the end returns `items: []`.

### HTTP conventions

Follows the [Azure API design guide](https://learn.microsoft.com/en-us/azure/architecture/best-practices/api-design):

- 201 Created with a `Location` header for new resources; 204 No Content for logout.
- 405 Method Not Allowed with an `Allow` header for a known path with the wrong method.
- 415 Unsupported Media Type when a request body is not `application/json`; 406 Not Acceptable when `Accept` excludes JSON.
- 409 Conflict when a state change does not fit the current session status.
- Pagination with a capped `limit`. Uses `page` instead of the guide's `offset`, so clients ask for page N rather than a number of items to skip.

### Errors

Invalid input returns 400 and lists every invalid field:

```json
{
  "error": "Validation failed",
  "details": [
    { "field": "email", "message": "email must be a valid email address" },
    { "field": "password", "message": "password must be at least 8 characters" }
  ]
}
```

Other errors return `{ "error": "<message>" }` with 401, 403, 404, 409, 413 or 500.

| Input | Rules |
|---|---|
| `fullName` | required, 2–100 characters |
| `email` | required, valid address, at most 254 characters, unique (409 if taken) |
| `phone` | required, 7–15 digits, optional leading `+` |
| `password` | required, 8–128 characters |
| `teacherId` | required, 24-character hex id of an existing teacher (404 if not found) |
| `startTime` | required, ISO 8601 string or ms timestamp, in the future |
| `endTime` | required, same format, after `startTime` |
| `dateTimestamp` | required, date in `YYYY-MM-DD` format (e.g. `2026-11-18`) |
| `page` / `limit` | integers, `page` ≥ 1, `limit` 1–100 |
| `:id` | 24-character hex id |
| Request body | valid JSON, at most 100kb |

## Postman

Import `postman_collection.json` and run it in order. No variables need setting. Postman's cookie jar carries the auth cookie between requests. Run it against `http://localhost` with `COOKIE_SECURE=false`, or against an HTTPS URL.

| # | Request | What it checks |
|---|---|---|
| 1 | Create user `newuser@mail.com` | 201 the first time, 409 `email already exists` on later runs |
| – | Login as that user | HttpOnly auth cookie; saves `userId` |
| 3 | Available sessions `2026-11-17`, `page=1&limit=10` | the 10 seeded sessions, `totalPages: 1`, AVAILABLE, sorted, teacher joined; saves a `teacherId` |
| 3 | Same date, `page=2&limit=10` | `items: []` (past the last page) |
| 2 | Create session for that teacher, tomorrow 10:00 UTC | 201 + `Location`, AVAILABLE by default |
| 4 | Book that session | BOOKED |
| 5 | Complete it | COMPLETED with `completedAt` |
| 6 | User sessions | the session is in `completed`, not `upcoming` |
| – | Login as seeded `test@mail.com` / `Pass@123` | 200, logged in as that user; saves `userId` |
| 6 | That user's sessions, `page=1&limit=5` | `upcoming` and `completed` each return `page`, `limit`, `total`, `totalPages` |

Available sessions runs before create session so the collection can take a teacher ID from the seeded data. Booking uses the newly created session, so the seeded slots stay available.

## Assumptions

- `book`, `complete`, `cancel` and `available` keep the URLs the assignment specifies, although the Azure guide prefers nouns (e.g. `PATCH /sessions/:id` with `{ "status": "BOOKED" }`).
- `dateTimestamp` keeps the assignment's name but takes a date only (`YYYY-MM-DD`), read as a UTC day.
- Teachers have no API or login; they are seeded on startup.
- Any logged-in user can create sessions for a teacher.
- Only the user who booked a session can cancel or complete it.
- Upcoming = `BOOKED`, completed = `COMPLETED`, regardless of the current time.
- A user can only view their own session list.
- Logout clears the cookie; a copied token stays valid until it expires (no server-side revocation list).
- CSRF is mitigated by `SameSite=Strict`; there is no separate CSRF token.
