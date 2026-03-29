# Push Notification Setup Instructions

To enable "Zomato-like" background notifications (even when the screen is off), you need to set up Web Push.

## 1. Install Dependencies
The project now requires `web-push` to handle server-side notification sending.

```bash
npm install web-push @types/web-push
```

## 2. Database Setup
Run the SQL migration to create the subscriptions table.
Copy the content of `supabase/migrations/push_subs.sql` and run it in your Supabase SQL Editor.

## 3. Generate VAPID Keys
Web Push requires a public/private key pair. You can generate them by running:

```bash
npx web-push generate-vapid-keys
```

This will output something like:
```
Public Key:
<your-public-key>

Private Key:
<your-private-key>
```

## 4. Configure Environment Variables
Add the following to your `.env.local` file (create it if it doesn't exist):

```env
NEXT_PUBLIC_VAPID_PUBLIC_KEY=<your-public-key>
VAPID_PRIVATE_KEY=<your-private-key>
```

## 5. Usage
1. Open the Admin / Order Dashboard.
2. Click the "Enable Sound" or "Unmute" button (if available) or wait for the prompt.
3. Accept the Notification permission.
4. The app will subscribe your device.
5. When a User places an order, you will receive a notification even if your phone is locked.

## Notes
- **Testing**: Push notifications work best on HTTPS. Locally (localhost), they usually work, but on mobile devices, you must access via HTTPS (e.g. Vercel deployment or ngrok).
- **iOS Support**: iOS Web Push requires the app to be "Added to Home Screen" (PWA installed) to receive background notifications reliably.
