
const { google } = require('googleapis');
const http       = require('http');
const url        = require('url');
const fs         = require('fs');
const path       = require('path');
const open       = require('open');   // npm install open@8

const CREDENTIALS_PATH = path.join(process.cwd(), 'credentials.json');
const TOKEN_PATH       = path.join(process.cwd(), 'token.json');
const SCOPES           = ['https://www.googleapis.com/auth/gmail.readonly'];

async function main() {
  if (!fs.existsSync(CREDENTIALS_PATH)) {
    console.error('ERROR: credentials.json not found in project root.');
    console.error('Download it from Google Cloud Console → APIs & Services → Credentials');
    process.exit(1);
  }

  const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf8'));
  const { client_secret, client_id, redirect_uris } = credentials.installed;

  // Use localhost redirect for desktop OAuth flow
  const redirectUri  = 'http://localhost:3000/oauth2callback';
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirectUri);

  // Build the consent URL
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',   // offline = gets refresh_token so it doesn't expire
    scope:       SCOPES,
    prompt:      'consent',   // force consent screen so refresh_token is always returned
  });

  console.log('\n=========================================');
  console.log('Opening browser for Gmail authorisation...');
  console.log('Log in with: gourav.kumar@oneguardian.in');
  console.log('=========================================\n');

  // Start a local server to catch the OAuth callback
  const server = http.createServer();
  server.listen(3000, async () => {
    await open(authUrl);   // opens the browser automatically
    console.log('Waiting for browser authorisation...');
  });

  // Wait for the OAuth redirect with the code
  const code = await new Promise((resolve, reject) => {
    server.on('request', (req, res) => {
      const parsed = url.parse(req.url, true);
      if (parsed.pathname === '/oauth2callback') {
        if (parsed.query.code) {
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end('<h2>Authorisation successful! You can close this tab.</h2>');
          resolve(parsed.query.code);
        } else {
          res.writeHead(400);
          res.end('No code received');
          reject(new Error('No code in OAuth callback'));
        }
        server.close();
      }
    });
  });

  // Exchange code for tokens
  const { tokens } = await oAuth2Client.getToken(code);
  oAuth2Client.setCredentials(tokens);

  // Save token.json
  fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens, null, 2));
  console.log(`\ntoken.json saved to: ${TOKEN_PATH}`);
  console.log('Setup complete — GmailUtility.js will now work in your tests.\n');
}

main().catch(err => {
  console.error('Auth failed:', err.message);
  process.exit(1);
});