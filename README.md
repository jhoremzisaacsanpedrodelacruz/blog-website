# My Board

A small community board built with Express, EJS, and PostgreSQL. Anyone can publish a post or leave a comment without creating an account.

## Run it

```bash
npm install
npm start
```

The app runs at http://localhost:3000. `npm run dev` starts it with file watching.

`DATABASE_URL` in `.env` points at the Postgres database. The tables are created automatically on the first run, and the existing board post is seeded once.

## Pages

- `/` — the personal blog home
- `/board` — the open board, with the post form and latest posts
- `/posts/:id` — a single board post with its comments
- `/museum` — artwork search using the Art Institute of Chicago's public API
- `/about` — project notes and API docs

## Public API

The board exposes a read-only JSON API. No key, CORS open.

- `GET /api/public/posts` — every post with `id`, `title`, `author`, `createdAt`, `commentCount`
- `GET /api/public/posts/:id` — one post with `body` and `comments`

## Museum API

The `/museum` page uses the [Art Institute of Chicago API](https://api.artic.edu/docs/). It needs no key. The server fetches search results and proxies artwork images so they load reliably outside the museum's site.
