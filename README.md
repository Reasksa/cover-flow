# Reaksaio

Windows desktop application for multi-platform social posting, scheduling, and automation.

## Features

- Link unlimited accounts across YouTube, TikTok, Facebook, Instagram, Twitter, LinkedIn
- Secure local storage encrypted with AES-GCM and master key stored via Windows Credential Manager (keytar)
- Upload images/videos, add captions and hashtags
- Queue posts or schedule them for any date/time
- Chrome automation (Selenium WebDriver) to assist login and opening posting pages
- Dashboard with overview and recent activity
- Import/Export data (accounts + schedules)

## Tech

- Electron (Windows .exe packaging via electron-builder)
- Selenium WebDriver for Chrome
- keytar for secure secret storage
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
- If ChromeDriver version mismatch occurs, update Chrome or install a compatible driver. Selenium 4 usually manages this automatically.
- Login and posting flows are user-assisted. Full automation per platform can be added modularly in `automation/`.

## Security

- The app never transmits credentials externally.
- Data is encrypted at rest using AES-256-GCM; master key is stored in Windows Credential Manager via keytar.
- OAuth 2.0 can be integrated per platform in future versions.

## Folder Structure

- `app/` — UI (HTML/CSS/JS)
- `automation/` — Selenium helpers
- `storage/` — Encrypted storage helper
- `main.js` — Electron main process
- `preload.js` — Secure IPC bridge
