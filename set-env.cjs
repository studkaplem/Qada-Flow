const fs = require('fs');
// for local development, load .env variables
try {
  require('dotenv').config();
} catch (e) {
}

const dir = './src/environments';
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

// read dotenv variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;

// check if all variables are present
if (!supabaseUrl || !supabaseKey || !vapidPublicKey) {
  console.error('WARNUNG: Umgebungsvariablen fehlen! Die App wird eventuell nicht funktionieren.');
  console.error('Lokal: Prüfe deine .env Datei.');
  console.error('Vercel: Prüfe deine Environment Variables in den Settings.');
}

const envConfigFile = `
export const environment = {
  production: true,
  supabaseUrl: '${supabaseUrl}',
  supabaseKey: '${supabaseKey}',
  vapidPublicKey: '${vapidPublicKey}'
};
`;

//  write the content to environment.ts file
const targetPath = './src/environments/environment.ts';
fs.writeFileSync(targetPath, envConfigFile);

console.log(`Angular environment.ts file generated correctly at ${targetPath} \n`);