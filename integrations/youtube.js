const fs = require('fs');
const http = require('http');
const { google } = require('googleapis');
const Store = require('../storage/store');

const store = new Store();

function getRedirectUri() {
  return 'http://localhost:8888/oauth2callback';
}

async function getOAuth2Client() {
  const settings = await store.getSettings();
  const clientId = settings.youtubeClientId;
  const clientSecret = settings.youtubeClientSecret;
  if (!clientId || !clientSecret) {
    throw new Error('YouTube API credentials not configured');
  }
  return new google.auth.OAuth2(clientId, clientSecret, getRedirectUri());
}

async function configure(clientId, clientSecret) {
  await store.setSettings({ youtubeClientId: clientId, youtubeClientSecret: clientSecret });
  return { success: true };
}

async function startAuthFlow(accountId) {
  const oauth2 = await getOAuth2Client();
  const scopes = [
    'https://www.googleapis.com/auth/youtube.upload',
    'https://www.googleapis.com/auth/youtube',
    'https://www.googleapis.com/auth/youtube.readonly'
  ];
  const url = oauth2.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: scopes
  });

  // Start a simple local server to receive the OAuth callback
  await new Promise((resolve, reject) => {
    const server = http.createServer(async (req, res) => {
      if (req.url.startsWith('/oauth2callback')) {
        const u = new URL(req.url, 'http://localhost:8888');
        const code = u.searchParams.get('code');
        try {
          const { tokens } = await oauth2.getToken(code);
          await store.setOAuthToken('youtube', accountId, tokens);
          res.statusCode = 200;
          res.setHeader('Content-Type', 'text/html');
          res.end('<html><body><h3>Authentication complete</h3><p>You can close this window and return to Reaksaio.</p></body></html>');
          server.close();
          resolve();
        } catch (e) {
          res.statusCode = 500;
          res.end('Authentication failed');
          server.close();
          reject(e);
        }
      } else {
        res.statusCode = 200;
        res.end('OK');
      }
    }).listen(8888, () => {
      // Server ready
    });
  });

  return { success: true, url };
}

async function uploadVideo({ accountId, filePath, title, description, tags, privacyStatus, scheduleAt }) {
  const oauth2 = await getOAuth2Client();
  const tokens = await store.getOAuthToken('youtube', accountId);
  if (!tokens) {
    throw new Error('YouTube account not authenticated');
  }
  oauth2.setCredentials(tokens);

  const youtube = google.youtube({ version: 'v3', auth: oauth2 });

  const resource = {
    snippet: {
      title: title || 'Untitled',
      description: description || '',
      tags: Array.isArray(tags) ? tags : []
    },
    status: {
      privacyStatus: privacyStatus || 'private'
    }
  };

  if (scheduleAt) {
    // publishAt must be RFC3339 timestamp and privacyStatus typically 'private' until publish
    resource.status.publishAt = new Date(scheduleAt).toISOString();
  }

  const media = { body: fs.createReadStream(filePath) };

  const resp = await youtube.videos.insert({
    part: 'snippet,status',
    requestBody: resource,
    media
  });

  return { success: true, videoId: resp.data.id || null };
}

module.exports = {
  configure,
  startAuthFlow,
  uploadVideo
};