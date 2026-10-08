# TaskOrb

Private boards of cards. Each board has its own background color. Each card holds tasks with an owner, status (open, on hold, in progress, done), priority, from and to dates, depends on, waiting for, blocks, next action, and notes. The last update is recorded automatically whenever the task changes. On hold requires a reason. A task whose To date has passed shakes until it is marked done.

Every board has a Done card. Marking a task done moves it there; reopening it moves it back to the card it came from. Switch a board to Timeline for a Gantt chart of its tasks by From and To date.

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

- `APP_URL`: the public address (`https://taskorb.app`), so invite links point at the hosted site.
- `FIREBASE_SERVICE_ACCOUNT`: the service account JSON on one line.

The site is served at `taskorb.app` (DNS at Hostinger: an `A` record for `@` to `216.24.57.1` and a `CNAME` for `www` to the `onrender.com` host). Every host the site answers on must be listed under Firebase Authentication, Settings, Authorized domains, or Google sign-in will be refused.

The app forwards `/__/auth/*` to Firebase, so Google's account picker names this site instead of the Firebase project. Sign-in runs through whichever host the visitor is on, as long as it is in `AUTH_HOSTS`; otherwise it falls back to `FIREBASE_AUTH_DOMAIN`. The Google OAuth client must list `https://<host>/__/auth/handler` as a redirect URI and `https://<host>` as a JavaScript origin for each of those hosts.

The build runs the test suite before `next build`. Do not deploy until `npm test` passes locally.

To check the live database, run `FIRESTORE_SMOKE=1 FIREBASE_SERVICE_ACCOUNT_PATH=secrets/taskorbit-service-account.json npx vitest run src/lib/firestore-store.smoke.test.ts`. It creates two throwaway users and deletes everything it wrote.

Health check: `/api/health`.

## Phone apps

The site installs as an app from the browser (Install button, or Share, Add to Home Screen on iPhone). Notifications can be pushed to the phone from the bell menu.

`native/` holds the Android and iOS apps (Capacitor). They open the hosted site, sign in with the native Google sheet, and receive push notifications through Firebase Cloud Messaging. The site address comes from `TASKORB_URL` (default: `https://taskorb.app`).

```bash
cd native
npm install
npx cap sync
npx cap open android   # Android Studio: Build, Generate Signed App Bundle
npx cap open ios       # Xcode: pick your team under Signing, then Product, Archive
```

Gradle 8.14 needs Java 21; Android Studio's bundled Java 25 is too new. Each signing key's SHA-1 and SHA-256 must be added to the Firebase Android app (`app.taskorb`) or Google sign-in fails. iOS push needs an APNs key uploaded under Firebase, Project settings, Cloud Messaging.
