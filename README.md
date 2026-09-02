# Tools

A small collection of self-contained backend tools I built for myself, bundled into one NestJS service. No relation between the tools other than living in the same repo/deployment.

**Stack:** NestJS · TypeORM · PostgreSQL · Socket.IO · node-cron

## Tools

### Short Link

A minimal URL shortener.

- `POST /short-link` — create a short link. Body: `{ originalUrl, code? }`.
  - `code` is optional; omit it to get a random 8-character code, or pass your own vanity code (3–32 chars, letters/numbers/`-`/`_`). A taken code returns `409`.
  - Returns the created link, including a one-time `deleteToken` — save it, it's the only way to delete the link later.
  - Links expire 7 days after creation.
  - Rate limited to 5 creations/minute per IP.
- `GET /short-link/:code` — redirects to the original URL and increments the click counter. `404` if unknown, `410` if expired.
- `GET /short-link/:code/stats` — JSON stats (code, originalUrl, clicks, createdAt, expiresAt). Never includes the delete token.
- `DELETE /short-link/:code` — deletes the link. Requires the `x-delete-token` header to match the token returned at creation; `403` otherwise.
- Expired links are purged automatically by a cron job every 3 hours.

### Temp Chat

Ephemeral, no-signup chat rooms over WebSocket (Socket.IO, namespace `/temp-chat`).

- `POST /temp-chat` — creates a new chat room and returns its `chatId`.
- `GET /temp-chat/messages-from-id` — fetch messages for a chat, optionally after a given message id (for polling/pagination). Body: `{ chatId, messageIdFrom? }`.
- WebSocket events:
  - `joinChat` `{ chatId, username }` — joins the room; broadcasts a system "user connected" message and the updated participant list.
  - `message` `{ chatId, message }` — broadcasts a chat message to the room. Rate limited to 10 messages/10s per socket.
  - `leaveChat` — explicitly leaves the current room; broadcasts a system "user left" message and the updated participant list.
  - Disconnecting (closing the socket) triggers the same "user left" cleanup automatically.
- Chats with no new messages for 2 hours are purged automatically by a cron job every hour.

## Running locally

```bash
cp .env.example .env          # adjust DB credentials if needed
npm run start:dev:db          # starts Postgres in Docker
npm run migration:run         # applies migrations
npm run start:dev             # starts the app with hot reload
```

Or run everything (app + db) in Docker: `npm run start:docker`.

## Tests

Tests run against a **real PostgreSQL database — nothing is mocked**. Every service, controller, and WebSocket gateway test spins up an actual NestJS app/module wired to Postgres via `AppDataSource`, and the WebSocket tests use real socket.io-client connections against a real listening server.

```bash
npm run start:dev:db     # Postgres in Docker
npm run migration:run    # apply schema
npm test                 # run the suite
```

What's covered:

- **`short-link.service.spec.ts`** — create, fetch, increment clicks, delete.
- **`short-link.controller.spec.ts`** — full HTTP flow: random and vanity codes, duplicate-code conflict, invalid URL rejection, stats (no leaked delete token), redirect + click counting, 404s, delete-token authorization.
- **`short-link.throttle.spec.ts`** — the 5 requests/minute rate limit on link creation, including the `429` once it's exceeded.
- **`temp-chat.service.spec.ts`** / **`temp-chat-message.service.spec.ts`** — chat/message creation, cascade delete.
- **`temp-chat.controller.spec.ts`** — chat creation over HTTP, message pagination via `messageIdFrom`.
- **`temp-chat.gateway.spec.ts`** — real WebSocket flows: join broadcasts + participant list, message broadcasting, a second user joining, explicit `leaveChat`, and disconnect-triggered cleanup.
- **`temp-chat.gateway.throttle.spec.ts`** — the 10 messages/10s per-socket rate limit on the `message` event.

CI (`.github/workflows/ci.yaml`) runs lint, type-check, migrations, and the full test suite against a Postgres service container on every push/PR to `main`/`dev`.
