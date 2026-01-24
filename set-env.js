const fs = require('fs');

// 1. Ordner erstellen, falls er auf Vercel noch nicht existiert
const dir = './src/environments';
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

// 2. Den Inhalt der Datei definieren
// Wir setzen production auf true, da Vercel ja dein Live-System ist.
// Die Keys holen wir uns aus den Vercel-Einstellungen (process.env).
const envConfigFile = `
export const environment = {
  production: true,
  supabaseUrl: '${process.env.SUPABASE_URL}',
  supabaseKey: '${process.env.SUPABASE_KEY}'
};
`;

// 3. Die Datei 'src/environments/environment.ts' schreiben
// (Genau diese Datei wird von deiner App importiert)
const targetPath = './src/environments/environment.ts';

fs.writeFileSync(targetPath, envConfigFile);

console.log(`Angular environment.ts file generated correctly at ${targetPath} \n`);