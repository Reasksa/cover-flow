# Reaksaio

Windows desktop application for multi-platform social posting, scheduling, and automation.

## Ultimate Features (100+ across modules)

Core
- Link unlimited accounts across YouTube, TikTok, Facebook, Instagram, Twitter, LinkedIn
- Prepare posts with templates, hashtag sets, captions, and media
- Queue now or schedule at any date/time
- Recurring schedules (daily/weekly/monthly)
- Calendar with click-to-schedule, job badges, and run-now actions
- Dashboard overview and activity feed
- Import/Export full workspace (accounts, queue, library, templates, hashtags, settings)
- Secure local storage encrypted with AES-GCM and master key via Windows Credential Manager (keytar)

Automation
- Chrome automation (Selenium WebDriver) assisting login and opening posting pages
- Best-effort media upload and caption injection on major platforms
- Background scheduler loop (30s) that opens due jobs automatically

Library & Templates
- Content Library: drag-drop/browse to collect assets, quick-attach to posts
- Caption Templates: create, manage, and apply templates instantly
- Hashtag Sets: save reusable groups, combine with ad-hoc tags

Analytics
- Summaries by platform and status (posted/failed/queued)
- Next scheduled time and total queued counter

YouTube Data API (Optional, OAuth2)
- Configure OAuth Client ID/Secret in Settings
- Authenticate per-account (local callback on http://localhost:8888/oauth2callback)
- Direct YouTube uploads via API (title, description, tags, privacyStatus, scheduled publish)

Security & Privacy
- Data at rest encrypted with AES-256-GCM
- Master key stored securely via keytar
- No credentials sent to external services unless you opt into OAuth for specific APIs

## Tech

- Electron (Windows .exe packaging via electron-builder)
- Selenium WebDriver for Chrome
- keytar for secure secret storage
- googleapis (optional) for YouTube Data API
- Encrypted JSON file for local data

## Development

1. Install Node.js (v18+ recommended) and Chrome.
2. Install dependencies:

   ```
   npm install
   ```

3. Run app in development:

   ```
   npm start
   ```

## Build Windows Installer (.exe)

1. On Windows 10+ run:

   ```
   npm run dist
   ```

2. Output installer will be in `dist/Reaksaio-Setup-<version>.exe`.

Notes:
- If ChromeDriver version mismatch occurs, update Chrome or install a compatible driver. Selenium 4 usually manages Chrome for Testing automatically in many cases.
- Login and posting flows are user-assisted. Basic upload automations are included:
  - YouTube: file input + title best-effort (or direct API upload if OAuth configured)
  - TikTok: file input + caption best-effort
  - Facebook: composer text + media best-effort
  Full automation per platform can be added modularly in `automation/`.
- The scheduler loop runs every 30s to open due jobs automatically.

## YouTube API Setup (Optional)

1. In Google Cloud Console, create an OAuth 2.0 Client (Desktop or Web).
2. Add redirect URI: `http://localhost:8888/oauth2callback`.
3. In Reaksaio Settings:
   - Paste Client ID and Client Secret, click Save.
   - Select your YouTube account in Uploads tab, then click “Authenticate Selected YouTube Account”.
4. After authentication completes, use “Direct YouTube Upload” in Uploads.

## Security

- The app never transmits stored credentials externally.
- Data is encrypted at rest using AES-256-GCM; master key is stored in Windows Credential Manager via keytar.
- OAuth 2.0 is opt-in per platform; tokens are stored locally and used only for actions you trigger.

## Folder Structure

- `app/` — UI (HTML/CSS/JS)
- `automation/` — Selenium helpers
- `integrations/` — Optional API integrations (YouTube Data API)
- `storage/` — Encrypted storage helper
- `main.js` — Electron main process
- `preload.js` — Secure IPC bridge
