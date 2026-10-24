# Chief – AI Chief of Staff Setup Guide

This guide walks you through setting up **Chief**, an executive AI Chief of Staff that synthesizes your Google Calendar and Gmail every morning into an actionable Morning Brief.

Chief supports **Demo Mode** out of the box with realistic sample meetings and emails so you can test all features immediately without any configuration. When you're ready to connect real Google data, follow the steps below.

---

## Quick Start (Demo Mode)

Chief runs immediately in **Demo Mode** if Google OAuth keys are not present in `.env`:
1. Ensure your Gemini API Key is set in `.env` (automatically injected in AI Studio).
2. Start the app:
   ```bash
   npm run dev
   ```
3. Open `http://localhost:3000`. You will see the yellow Demo Mode banner, realistic sample calendar events, and triaged emails ready for testing.

---

## Step-by-Step: Connecting Real Google Calendar & Gmail

To connect real Google Calendar and Gmail accounts, follow these steps to generate Google OAuth credentials:

### Step 1: Create a Google Cloud Project
1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Click the project dropdown at the top of the page and click **New Project**.
3. Name your project (e.g. `Chief-AI-Chief-of-Staff`) and click **Create**.

### Step 2: Enable Calendar and Gmail APIs
1. In your project, navigate to **APIs & Services > Library**.
2. Search for **Google Calendar API** and click **Enable**.
3. Search for **Gmail API** and click **Enable**.

### Step 3: Configure the OAuth Consent Screen
1. Go to **APIs & Services > OAuth consent screen**.
2. Select **External** (or **Internal** if using a Google Workspace organization) and click **Create**.
3. Fill in the App Information:
   - **App name**: `Chief AI Chief of Staff`
   - **User support email**: your email address
   - **Developer contact information**: your email address
4. Click **Save and Continue**.
5. **Scopes Screen**:
   Click **Add or Remove Scopes** and add:
   - `https://www.googleapis.com/auth/calendar.readonly` (Read-only access to calendar events)
   - `https://www.googleapis.com/auth/gmail.readonly` (Read-only access to emails)
   - `https://www.googleapis.com/auth/gmail.compose` (Compose email drafts—Chief never sends automatically)
   Click **Update** and then **Save and Continue**.
6. **Test Users Screen**:
   - Because your app is in "Testing" mode, Google requires you to explicitly whitelist your Google email.
   - Click **+ Add Users**, type your Gmail address, and click **Save and Continue**.

### Step 4: Create OAuth 2.0 Client ID Credentials
1. Navigate to **APIs & Services > Credentials**.
2. Click **+ Create Credentials > OAuth client ID**.
3. Application type: Select **Web application**.
4. Name: `Chief Web Client`.
5. Under **Authorized redirect URIs**, click **+ Add URI** and enter:
   ```
   http://localhost:3000/api/auth/google/callback
   ```
   *(If deploying to a domain, add `https://your-domain.com/api/auth/google/callback`)*
6. Click **Create**.
7. Copy your **Client ID** and **Client Secret**.

### Step 5: Configure `.env`
Create a `.env` file in the root directory (copied from `.env.example`):

```bash
# Gemini API Key (from https://aistudio.google.com/)
GEMINI_API_KEY="your-gemini-api-key"

# Google OAuth Credentials (from Step 4)
GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-client-secret"
GOOGLE_REDIRECT_URI="http://localhost:3000/api/auth/google/callback"

# Session & Token Encryption Secret (any 32+ character random string)
SESSION_SECRET="chief-super-secret-encryption-key-random-32-chars"
```

### Step 6: Connect Your Account in Chief
1. Start the server (`npm run dev`).
2. Go to **Settings** in the left sidebar.
3. In the **Google Workspace Connection** section, click **Connect Google Account**.
4. Authorize access on the Google sign-in screen.
5. Chief will securely encrypt and store the refresh token in SQLite.
6. The yellow Demo Mode banner will change to a green **Live Google Data Connected** indicator.

---

## Architecture & Security Notes

- **Zero Auto-Send**: Chief only creates drafts via `gmail.compose` and never automatically sends emails.
- **Minimum Scopes**: Calendar and Gmail read access are strictly `readonly`.
- **Encrypted Tokens**: OAuth refresh tokens are encrypted using AES-256 before storage in SQLite.
- **Zero Hallucination AI Rule**: Gemini 2.5 Flash is instructed to strictly synthesize the provided calendar and email data.
- **Data Deletion**: A "Delete my data" button is provided in Settings to wipe all stored tokens, briefs, and cached events from SQLite.
