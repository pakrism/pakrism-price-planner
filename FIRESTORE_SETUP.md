# Firestore setup for Price Planner

The calculator works with built-in defaults, but shared admin config requires Firestore rules for `pricePlanner/config`.

## Quick fix (one-time)

From `pr-bookings-manager`:

```bash
cd ~/pr-bookings-manager
npx firebase-tools login
npm run deploy:rules
```

## Manual fix (Firebase Console)

If you prefer the UI:

1. Open [Firestore Rules](https://console.firebase.google.com/project/pakrism-bookings/firestore/rules)
2. Add this block **before** the closing `}` of `match /databases/{database}/documents`:

```
    match /pricePlanner/{doc} {
      allow read: if request.auth != null;
      allow write: if isAdmin();
    }
```

Use `signedIn()` / `isAdmin()` if your rules file already defines those helper functions (see `pr-bookings-manager/firestore.rules`).

3. Click **Publish**

## Seed config (first time)

After rules are live, log in as **admin** on https://pr-plan.netlify.app → **Admin** → any section → **Save**.

The app auto-seeds `pricePlanner/config` on first successful admin load if the document is missing.

## OpenAI key for AI requirement parsing

The **Parse with AI** button calls the `parseClientRequirement` Cloud Function in `pr-bookings-manager`.

1. Create an API key at [OpenAI API keys](https://platform.openai.com/api-keys)
2. Store it as a Firebase Functions secret:

```bash
cd ~/pr-bookings-manager
npx firebase-tools login
npx firebase-tools functions:secrets:set OPENAI_API_KEY --project pakrism-bookings
```

3. Deploy the function:

```bash
firebase deploy --only functions:parseClientRequirement --project pakrism-bookings
```

If the secret is missing or the function is not deployed, the calculator falls back to local keyword parsing and shows the actual error message.

**Never put your OpenAI key in the frontend, `.env` files committed to git, or Netlify env vars.** If a key was ever pasted in chat or committed, revoke it at [OpenAI API keys](https://platform.openai.com/api-keys) and create a new one before running the command above.

## Callable URL for Parse with AI (DNS workaround)

Gen2 functions may fail DNS lookup on `cloudfunctions.net` from some networks. The app calls the function via `httpsCallableFromURL` with this fallback chain:

1. `VITE_PARSE_REQUIREMENT_URL` (Netlify / local env)
2. Cloud Run URL (default in code)
3. `cloudfunctions.net` URL

After deploying the function, print current URLs:

```bash
cd ~/pr-bookings-manager
npx firebase-tools functions:list --project pakrism-bookings --json | node -pe "const f=JSON.parse(require('fs').readFileSync(0,'utf8')).result[0]; console.log('cloudfunctions:', f.uri);"
```

Set on Netlify (Site configuration → Environment variables), then trigger a new deploy:

```
VITE_PARSE_REQUIREMENT_URL=https://parseclientrequirement-kuz6vb23eq-uc.a.run.app
```

Update this value if the Cloud Run URL changes after a redeploy.

## Verify

1. Hard refresh https://pr-plan.netlify.app
2. Log in — console should not show config permission errors
3. Yellow “Using built-in defaults” banner should be gone
4. Paste a client message → **Parse with AI** should populate calculator fields (when signed in and function is deployed)
