const fs = require('fs');
// Versuche dotenv zu laden (nur für lokale Entwicklung relevant)
try {
  require('dotenv').config();
} catch (e) {
  // Auf Vercel ist dotenv nicht installiert/nötig, da Variablen dort gesetzt sind.
  // Wir ignorieren den Fehler einfach.
}

// 1. Ordner erstellen
const dir = './src/environments';
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

// 2. Werte holen
// dotenv füllt process.env lokal. Vercel füllt process.env automatisch.
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;

// Sicherheits-Check: Warnen, wenn Variablen fehlen
if (!supabaseUrl || !supabaseKey || !vapidPublicKey) {
  console.error('WARNUNG: Umgebungsvariablen fehlen! Die App wird eventuell nicht funktionieren.');
  console.error('Lokal: Prüfe deine .env Datei.');
  console.error('Vercel: Prüfe deine Environment Variables in den Settings.');
}

// 3. Inhalt der Datei definieren
const envConfigFile = `
export const environment = {
  production: true,
  supabaseUrl: '${supabaseUrl}',
  supabaseKey: '${supabaseKey}',
  vapidPublicKey: '${vapidPublicKey}'
};
`;

// 4. Datei schreiben
const targetPath = './src/environments/environment.ts';
fs.writeFileSync(targetPath, envConfigFile);

console.log(`Angular environment.ts file generated correctly at ${targetPath} \n`);