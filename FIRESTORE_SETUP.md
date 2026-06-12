# Firestore setup for Price Planner

The calculator works with built-in defaults, but shared admin config requires Firestore rules for `pricePlanner/config`.

## Quick fix (one-time)

From `pr-bookings-manager`:

```bash
cd ~/pr-bookings-manager
npx firebase-tools login
./scripts/deploy-firestore-rules.sh
```

Or:

```bash
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

## Verify

1. Hard refresh https://pr-plan.netlify.app
2. Log in — console should not show config permission errors
3. Yellow “Using built-in defaults” banner should be gone
