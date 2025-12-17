# Fix: Google OAuth Redirect URI Mismatch Error

## The Problem

You're seeing: `Error 400: redirect_uri_mismatch`

This happens when the redirect URI in Google Cloud Console doesn't exactly match what NextAuth is sending.

## Quick Fix Steps

### Step 1: Check Your Current Setup

1. **Check what port your app is running on:**
   - Look at your terminal where `npm run dev` is running
   - It should show something like: `Local: http://localhost:3000` or `http://localhost:3001`

2. **Check your `.env.local` file:**
   - Your `NEXTAUTH_URL` should match the port your app is running on
   - Currently it's set to: `http://localhost:3001`
   - If your app runs on port 3000, change it to: `http://localhost:3000`

### Step 2: Update Google Cloud Console

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/
   - Select your project

2. **Navigate to OAuth Credentials**
   - Go to "APIs & Services" → "Credentials"
   - Find your OAuth 2.0 Client ID
   - Click the edit icon (pencil) to edit it

3. **Add/Update Authorized Redirect URIs**
   
   Make sure you have BOTH of these (if running on port 3000):
   ```
   http://localhost:3000/api/auth/callback/google
   ```
   
   OR if running on port 3001:
   ```
   http://localhost:3001/api/auth/callback/google
   ```

   **Important Notes:**
   - The URL must match EXACTLY (including `http://` not `https://`)
   - No trailing slashes
   - Port number must match your `NEXTAUTH_URL`
   - The path must be exactly `/api/auth/callback/google`

4. **Save the changes**
   - Click "Save" at the bottom

### Step 3: Update Your .env.local

Make sure `NEXTAUTH_URL` matches the port your app runs on:

**If app runs on port 3000:**
```env
NEXTAUTH_URL="http://localhost:3000"
```

**If app runs on port 3001:**
```env
NEXTAUTH_URL="http://localhost:3001"
```

### Step 4: Restart Your Dev Server

After making changes:

1. Stop your dev server (Ctrl+C)
2. Restart it:
   ```bash
   npm run dev
   ```
3. Try signing in again

## Common Issues

### Issue: "Still getting redirect_uri_mismatch"

**Solution:**
- Double-check the redirect URI in Google Cloud Console matches EXACTLY
- Make sure there are no extra spaces or characters
- Verify the port number matches
- Wait a few minutes after saving - Google sometimes takes a moment to update

### Issue: "App runs on different port than expected"

**Solution:**
- Check what port Next.js is actually using (look at terminal output)
- Update both `NEXTAUTH_URL` in `.env.local` AND the redirect URI in Google Cloud Console
- Make sure they match exactly

### Issue: "Works locally but not in production"

**Solution:**
- Add your production URL to Google Cloud Console:
  ```
  https://yourdomain.com/api/auth/callback/google
  ```
- Update `NEXTAUTH_URL` in your production environment:
  ```env
  NEXTAUTH_URL="https://yourdomain.com"
  ```

## Verification Checklist

Before trying to sign in again, verify:

- [ ] `NEXTAUTH_URL` in `.env.local` matches your app's port
- [ ] Redirect URI in Google Cloud Console matches exactly: `http://localhost:PORT/api/auth/callback/google`
- [ ] No trailing slashes in the redirect URI
- [ ] Using `http://` not `https://` for localhost
- [ ] Dev server restarted after changes
- [ ] Waited a minute after updating Google Cloud Console

## Still Having Issues?

1. **Check the exact error in browser console:**
   - Open browser DevTools (F12)
   - Check the Network tab for the failed request
   - Look at the error details

2. **Verify your OAuth credentials:**
   - Make sure `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are correct in `.env.local`
   - No extra spaces or quotes

3. **Try creating a new OAuth client:**
   - Sometimes it's easier to start fresh
   - Delete the old one and create a new OAuth 2.0 Client ID
   - Make sure to set the redirect URI correctly from the start

---

**Quick Reference:**
- Your current `NEXTAUTH_URL`: `http://localhost:3001`
- Required redirect URI: `http://localhost:3001/api/auth/callback/google`
- Make sure this exact URL is in Google Cloud Console!

