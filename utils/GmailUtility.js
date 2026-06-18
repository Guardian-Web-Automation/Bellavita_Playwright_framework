// utils/GmailUtility.js
const { google } = require('googleapis');
const fs   = require('fs');
const path = require('path');

const CREDENTIALS_PATH = path.join(process.cwd(), 'credentials.json');
const TOKEN_PATH       = path.join(process.cwd(), 'token.json');

// Builds a Gmail client.
// Priority:
//   1. Environment variables (CI / GitHub Actions)
//   2. Local credentials.json + token.json files (developer workstation)
async function getGmailClient() {
  let clientId, clientSecret, redirectUri;
  let tokenData;

  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    // ── CI path: read from environment variables ─────────────────
    clientId     = process.env.GOOGLE_CLIENT_ID;
    clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    redirectUri  = process.env.GOOGLE_REDIRECT_URI || 'http://localhost';
  } else {
    // ── Local dev path: read from credentials.json ───────────────
    if (!fs.existsSync(CREDENTIALS_PATH)) {
      throw new Error(
        'Gmail credentials not found. Either set GOOGLE_CLIENT_ID / ' +
        'GOOGLE_CLIENT_SECRET env vars, or place credentials.json in the project root.'
      );
    }
    const raw = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf8'));
    clientId     = raw.installed.client_id;
    clientSecret = raw.installed.client_secret;
    redirectUri  = raw.installed.redirect_uris[0];
  }

  const oAuth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

  if (process.env.GOOGLE_REFRESH_TOKEN) {
    // ── CI path: build token from env vars ───────────────────────
    tokenData = {
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
      access_token:  process.env.GOOGLE_ACCESS_TOKEN || undefined,
      token_type:    'Bearer',
    };
  } else {
    // ── Local dev path: read from token.json ─────────────────────
    if (!fs.existsSync(TOKEN_PATH)) {
      throw new Error(
        'Gmail token not found. Either set GOOGLE_REFRESH_TOKEN env var, ' +
        'or run `node utils/gmailAuth.js` once to generate token.json.'
      );
    }
    tokenData = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));
  }

  oAuth2Client.setCredentials(tokenData);
  return google.gmail({ version: 'v1', auth: oAuth2Client });
}

/**
 * Polls Gmail for the latest GoKwik OTP email and extracts the 4-digit code.
 *
 * @param {object}  options
 * @param {number}  [options.maxWaitMs=40000]     Total polling window (ms)
 * @param {number}  [options.pollIntervalMs=3000]  How often to check (ms)
 * @param {number}  [options.after]               Unix timestamp (ms) —
 *                  only emails with internalDate > after are accepted.
 *                  Pass Date.now() captured BEFORE clicking Send OTP
 *                  to guarantee we never read a stale OTP.
 * @returns {Promise<string>} 4-digit OTP string
 */
async function fetchGokwikOtp({
  maxWaitMs      = 40_000,
  pollIntervalMs =  3_000,
  after          = null,
} = {}) {

  const gmail    = await getGmailClient();
  const deadline = Date.now() + maxWaitMs;

  console.log(
    `Waiting up to ${maxWaitMs / 1000}s for GoKwik OTP email` +
    (after ? ` (after ${new Date(after).toLocaleTimeString()})` : '') +
    '...'
  );

  while (Date.now() < deadline) {
    try {
      // Search inbox for GoKwik SMS notification emails
      // newer_than:3m gives a 3-minute window — wide enough to catch
      // the email but the `after` filter below handles exact freshness
      const searchRes = await gmail.users.messages.list({
        userId:     'me',
        q:          'subject:"GKKWIK-S" newer_than:3m',
        maxResults:  5,   // fetch up to 5 so we can pick the freshest one
      });

      const messages = searchRes.data.messages;

      if (messages && messages.length > 0) {

        // Sort by recency — process newest first
        for (const msg of messages) {
          const msgRes = await gmail.users.messages.get({
            userId: 'me',
            id:     msg.id,
            format: 'full',
          });

          const emailTimestamp = parseInt(msgRes.data.internalDate, 10);

          // ── KEY FIX ──────────────────────────────────────────────
          // Skip this email if it arrived BEFORE we clicked Send OTP.
          // internalDate is milliseconds epoch from Gmail API.
          // This prevents fetching OTPs from previous test runs.
          // ─────────────────────────────────────────────────────────
          if (after && emailTimestamp < after) {
            console.log(
              `Skipping stale OTP email from ${new Date(emailTimestamp).toLocaleTimeString()} (before our request)`
            );
            continue;
          }

          const body = extractEmailBody(msgRes.data);
          console.log(`Email body: ${body.substring(0, 80)}`);

          // GoKwik format: "Use code 3258 for getting your saved addresses"
          const otpMatch =
            body.match(/Use code\s+(\d{4})/i) ||
            body.match(/\b(\d{4})\b/);

          if (otpMatch) {
            const otp = otpMatch[1];
            console.log(`OTP found: ${otp} (email time: ${new Date(emailTimestamp).toLocaleTimeString()})`);
            return otp;
          }

          console.log('Email matched but OTP not parsed — trying next...');
        }

        console.log('No fresh OTP email yet — waiting...');
      } else {
        console.log('No OTP email yet — waiting...');
      }

    } catch (err) {
      console.warn(`Gmail poll error: ${err.message}`);
    }

    await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
  }

  throw new Error(`OTP email not received within ${maxWaitMs / 1000} seconds`);
}

function extractEmailBody(messageData) {
  const payload = messageData.payload;

  if (payload.body && payload.body.data) {
    return Buffer.from(payload.body.data, 'base64').toString('utf8');
  }

  if (payload.parts) {
    for (const part of payload.parts) {
      if (part.mimeType === 'text/plain' && part.body?.data) {
        return Buffer.from(part.body.data, 'base64').toString('utf8');
      }
    }
    for (const part of payload.parts) {
      if (part.mimeType === 'text/html' && part.body?.data) {
        return Buffer.from(part.body.data, 'base64').toString('utf8');
      }
    }
  }

  return messageData.snippet || '';
}

module.exports = { fetchGokwikOtp };