# DieselUp

DieselUp is a cross-platform diesel ordering and delivery system for web, Android, and iOS. One Expo Router application serves customer, supplier, driver, admin, and super-admin roles; Firebase Functions owns trusted pricing, inventory, payment, refund, assignment, and delivery transitions.

No supplier, order, price, vehicle, location, or analytics content is seeded in the client. Unconfigured and empty systems render explicit configuration or empty states.

## What is implemented

- Email/password, cross-platform Google login, cross-platform Firebase phone OTP, and protected custom-claim routing
- Customer dashboard, saved locations, five-step ordering, live inventory marketplace, wallet, Paystack, receipts, reorder, cancellation, notifications, and chat
- Firestore-backed driver tracking, order timelines, Google Maps, OTP/QR handoff, photo proof, and guarded delivery state transitions
- Supplier approval documents, marketplace configuration, tanks, inventory audit history, drivers, customer summaries, orders, and reports
- Admin network dashboard, supplier/document review, market settings, refunds, analytics, and CSV/XLSX/PDF export
- Firebase App Check, FCM, Analytics, Remote Config, Storage, Cloud Functions, Firestore rules/indexes, rate limits, and scheduled daily rollups
- Expo EAS profiles and Firebase Hosting static export

## Local setup

Requirements: Node 20, npm 10+, JDK 21 for Firebase emulators, an Expo development build for native Firebase modules, and real Firebase/Google/Paystack projects.

```powershell
npm install
npm --prefix functions install
npm --prefix admin install
Copy-Item .env.example .env
firebase login
firebase use --add
```

Fill `.env` with the Firebase web configuration, Paystack public key, Google Maps browser key, App Check site key, web-push VAPID key, Google OAuth client IDs, and EAS project ID. Do not put Paystack’s secret key in `.env` or any `EXPO_PUBLIC_` variable.

Add the native Firebase files outside source control:

- `google-services.json` and set `GOOGLE_SERVICES_JSON` to its path for Android.
- `GoogleService-Info.plist` through the EAS secret/file configuration for iOS.

Enable Firebase Authentication providers for Email/Password, Phone, and Google. Enable Firestore, Storage, Analytics, Remote Config, App Check, Cloud Messaging, and the Blaze billing plan required by Functions/external API calls.

For Google Cloud, enable Maps SDK for Android, Maps SDK for iOS, Maps JavaScript/Embed API, Places API, and the relevant App Check providers. Restrict every browser/native/server key by app, API, and platform.

## Server secrets and integrations

```powershell
firebase functions:secrets:set PAYSTACK_SECRET_KEY
firebase functions:secrets:set GOOGLE_MAPS_SERVER_KEY
npm --prefix functions run build
firebase deploy --only firestore,storage,functions
```

Set the `APP_BASE_URL` Functions parameter to the production HTTPS origin during deployment. In Paystack, configure the webhook as the deployed `paystackWebhook` HTTPS Function URL. Payment success is never accepted from the browser callback; the signed webhook is verified and the transaction is re-fetched from Paystack.

Install Firebase’s Trigger Email extension against the `mail` collection to deliver driver invitations. Configure its SMTP provider and authorized sender before enabling invitations.

Create the first admin only after that person has registered a normal Firebase account. Run with Application Default Credentials scoped to the intended project:

```powershell
npm --prefix functions run bootstrap-admin -- admin@your-company.com
```

The script writes the Firestore role, sets the custom claim, and revokes existing sessions.

## Development and verification

```powershell
npm run typecheck
npm --prefix functions run build
npx expo-doctor
npm run export:web
npm run test:rules
npm --prefix admin run dev
```

`test:rules` starts the Firestore emulator and requires JDK 21. The suite checks anonymous denial, account isolation, role-escalation prevention, address ownership, and assigned-driver tracking writes.

Run the app against emulators by setting `EXPO_PUBLIC_USE_EMULATORS=true`, then:

```powershell
npm run firebase:emulators
npm run start
```

Native Firebase Analytics, App Check, Remote Config, and FCM require an Expo development build; Expo Go is not sufficient.

## Deployment

```powershell
npm run export:web
firebase deploy --only hosting
npx eas build --platform android --profile production
npx eas build --platform ios --profile production
```

Before production launch, run an end-to-end staging pass with real sandbox/test credentials for every role, Paystack webhook/refund, FCM/APNs delivery, Google Places quotas, App Check enforcement, background location permissions, Storage uploads, and all rule tests. No live integration can be certified from source code without those project credentials and external consoles.

## Data model

Primary collections are `users`, `customers`, `suppliers`, `drivers`, `orders`, `tracking`, `wallets`, `notifications`, `conversations`, `inventory`, `deliveries`, `support_tickets`, `reviews`, `analytics`, and `settings`. High-volume tracking points, messages, wallet transactions, addresses, documents, and audit history use subcollections. Composite indexes are declared in `firestore.indexes.json`; direct financial and operational writes are denied by `firestore.rules` and performed through Functions.
