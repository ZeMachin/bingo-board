#!/usr/bin/env node
// Simple script to fetch rows from the configured Google Sheet for quick local testing.
// It reads values from src/environments/.env (which in this repo contains the service account creds).

const { GoogleSpreadsheet } = require('google-spreadsheet');
const fs = require('fs');
const path = require('path');

function parseDotEnv(contents) {
  const lines = contents.split(/\r?\n/);
  const out = {};
  for (const line of lines) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?(.*?)"?\s*$/);
    if (!m) continue;
    const key = m[1];
    let val = m[2];
    // strip surrounding quotes if present
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    out[key] = val;
  }
  return out;
}

async function main() {
  const envPath = path.join(__dirname, '..', 'src', 'environments', '.env');
  if (!fs.existsSync(envPath)) {
    console.error('No src/environments/.env found. Ensure credentials are available for testing.');
    process.exit(2);
  }

  const env = parseDotEnv(fs.readFileSync(envPath, 'utf8'));
  const sheetId = env.SHEET_ID;
  const clientEmail = env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  let privateKey = env.GOOGLE_PRIVATE_KEY && env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n');

  if (!sheetId || !clientEmail || !privateKey) {
    console.error('Missing required env values (SHEET_ID, GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY)');
    process.exit(2);
  }

  // Ensure the PEM has proper newlines for signing
  if (!privateKey.includes('\n')) {
    privateKey = privateKey.replace('-----BEGIN PRIVATE KEY-----', '-----BEGIN PRIVATE KEY-----\n');
    privateKey = privateKey.replace('-----END PRIVATE KEY-----', '\n-----END PRIVATE KEY-----');
  }

  try {
    // Older approach compatible with various versions: create a JWT and pass it to the constructor
    const { JWT } = require('google-auth-library');
    const jwt = new JWT({
      email: clientEmail,
      key: privateKey,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const doc = new GoogleSpreadsheet(sheetId, jwt);
    await doc.loadInfo();
    console.log('Loaded doc:', doc.title);

    // pick sheet using title (preferred) or index
    let sheet = null;
    if (env.SHEET_TAB_TITLE) sheet = doc.sheetsByTitle && doc.sheetsByTitle[env.SHEET_TAB_TITLE];
    if (!sheet) {
      const idx = env.SHEET_TAB_INDEX ? Number(env.SHEET_TAB_INDEX) : 0;
      sheet = doc.sheetsByIndex[idx];
    }
    if (!sheet) {
      console.error('Could not locate requested sheet tab (by title or index)');
      process.exit(2);
    }
    console.log('Sheet:', sheet.title, 'rows:', sheet.rowCount);

    const headerRow = env.SHEET_HEADER_ROW ? Number(env.SHEET_HEADER_ROW) : 1;
    let headersAvailable = false;
    try { headersAvailable = Array.isArray(sheet.headerValues) && sheet.headerValues.length > 0; } catch (e) { headersAvailable = false; }

    if ((headerRow > 1) || !headersAvailable) {
      try {
        let token = jwt.credentials && jwt.credentials.access_token;
        if (!token) {
          const at = await jwt.getAccessToken();
          token = typeof at === 'string' ? at : at && at.token;
        }
        if (token) {
          const range = `'${sheet.title}'!${headerRow}:${headerRow}`;
          const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(range)}?majorDimension=ROWS`;
          const resp = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
          if (resp.ok) {
            const j = await resp.json();
            if (Array.isArray(j.values) && j.values.length > 0) {
              sheet.headerValues = j.values[0].map(v => String(v));
              console.log('Header values fetched:', sheet.headerValues);
            } else {
              console.warn('No header values returned from API');
            }
          } else {
            console.warn('Could not fetch header row:', await resp.text());
          }
        }
      } catch (err) { console.warn('Failed to fetch header row:', err); }
    }

    try {
      const rows = await sheet.getRows({ limit: 5 });
      console.log('First rows:');
      for (const r of rows) console.log(r._rawData);
    } catch (errRows) {
      console.warn('Could not read rows (maybe no header row). Fallback to raw cells:', (errRows && errRows.message) || errRows);
      // Fallback: attempt to print raw row data available on the sheet object
      if (sheet._cells && Array.isArray(sheet._cells)) {
        const byRow = {};
        for (const cell of sheet._cells) {
          const r = cell.row;
          byRow[r] = byRow[r] || [];
          byRow[r][cell.col - 1] = cell.value;
        }
        const rowsArr = Object.keys(byRow).sort((a,b)=>Number(a)-Number(b)).map(k => byRow[k]);
        console.log('First raw rows:');
        for (let i = 0; i < Math.min(5, rowsArr.length); i++) console.log(rowsArr[i]);
      }
    }
  } catch (err) {
    console.error('Failed to fetch sheet:', err);
    process.exit(1);
  }
}

main();
