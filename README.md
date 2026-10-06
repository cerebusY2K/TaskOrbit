# TaskOrbit

Private boards of cards. Each board has its own background color. Each card holds tasks with an owner, status (open, on hold, in progress, done), priority, due date, depends on, waiting for, blocks, next action, last update, and notes. On hold requires a reason. A task whose due date has passed shakes until it is marked done.

Every account starts with a Main board and a Me card. Cards you create are visible only to you. Share an invite link from the board; the other person opens it and signs in with Google.

## Run it locally

```bash
npm install
npm test
npm run dev
```

Sign-in is Google. Until a private Firestore database is connected, data is stored in `data/db.json` on this computer.

## Firebase

Create a Firebase project (or use one you already have) and tell the app about it with environment variables. Copy `.env.example` to `.env.local`.

1. Authentication: enable Google.
2. Add a web app and copy the config into `FIREBASE_API_KEY`, `FIREBASE_AUTH_DOMAIN`, `FIREBASE_PROJECT_ID`, `FIREBASE_APP_ID`, and `FIREBASE_MESSAGING_SENDER_ID`.
3. Add `localhost` under Authentication, Settings, Authorized domains.
4. Create a separate Firestore database when you want data off this computer, then add a service account key as `FIREBASE_SERVICE_ACCOUNT` or `FIREBASE_SERVICE_ACCOUNT_PATH`.

Google sign-in works from the web config alone. The server checks the Google token before creating a session.

## Render

`render.yaml` is a Render Blueprint. The public Firebase web config is already in it. When Render asks, fill in:

- `APP_URL`: the public `https://…onrender.com` address, so invite links point at the hosted site.
- `FIREBASE_SERVICE_ACCOUNT`: the service account JSON on one line.

Add the `onrender.com` host under Firebase Authentication, Settings, Authorized domains, or Google sign-in will be refused.

The build runs the test suite before `next build`. Do not deploy until `npm test` passes locally.

To check the live database, run `FIRESTORE_SMOKE=1 FIREBASE_SERVICE_ACCOUNT_PATH=secrets/taskorbit-service-account.json npx vitest run src/lib/firestore-store.smoke.test.ts`. It creates two throwaway users and deletes everything it wrote.

Health check: `/api/health`.
