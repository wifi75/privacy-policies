// Deploy di UNA sola informativa, con la garanzia che le altre non cambino.
//
// Perché serve. Le pagine di tutte le app vivono in un solo Worker: il
// dominio `workers.dev` appartiene a un Worker soltanto, quindi non si
// possono servire `/superlotw` e `/lumatextfx` da due deploy separati senza
// cambiare gli URL — e quegli URL sono già dentro app pubblicate e schede
// store, quindi non si toccano. La conseguenza è che `wrangler deploy`
// ripubblica sempre tutte le pagine, comprese quelle che non hai modificato.
//
// Di per sé non è un problema: ripubblicare una pagina identica non cambia
// nulla. Lo diventa se il sorgente locale è più vecchio di ciò che è online,
// perché allora il deploy fa *tornare indietro* l'informativa di un'altra
// app. È successo davvero il 27 agosto 2026: una copia locale scollegata
// avrebbe cancellato da un'altra informativa una sezione sugli acquisti
// in-app pubblicata poche ore prima.
//
// Questo script rende quello scenario impossibile: confronta ogni pagina con
// quella realmente online e si rifiuta di pubblicare se cambierebbe una
// pagina diversa da quella che hai dichiarato di voler aggiornare.
//
//   node scripts/deploy-sicuro.mjs superlotw        verifica e pubblica
//   node scripts/deploy-sicuro.mjs superlotw --solo-verifica
//   node scripts/deploy-sicuro.mjs --solo-verifica  confronta tutto e basta

import { readFileSync, readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const BASE = 'https://privacy.tizianocassone.workers.dev';
const WORKER_DIR = join(dirname(fileURLToPath(import.meta.url)), '..');
const PAGES_DIR = join(WORKER_DIR, 'src', 'pages');

const args = process.argv.slice(2);
const soloVerifica = args.includes('--solo-verifica');
const bersaglio = args.find((a) => !a.startsWith('--')) ?? null;

// Lo spazio in fondo al file (newline finale, CRLF) non è una differenza di
// contenuto: normalizzare evita falsi allarmi che, a forza di ripetersi,
// insegnerebbero a ignorare l'avviso.
const normalizza = (s) => s.replace(/\r\n/g, '\n').replace(/\s+$/, '');

const slugDiFile = (f) => (f === 'index.html' ? '' : f.replace(/\.html$/, ''));

async function confronta(file) {
  const slug = slugDiFile(file);
  const locale = normalizza(readFileSync(join(PAGES_DIR, file), 'utf8'));
  // `?_` aggira la cache di un'ora dichiarata dal Worker: senza, si
  // confronterebbe il sorgente con una copia vecchia e il controllo mentirebbe.
  const risposta = await fetch(`${BASE}/${slug}?_=${Date.now()}`);
  if (!risposta.ok) throw new Error(`${slug || '(home)'}: HTTP ${risposta.status}`);
  const online = normalizza(await risposta.text());
  return { file, slug: slug || '(home)', diversa: locale !== online };
}

// L'esito passa da `process.exitCode`, non da `process.exit()`: su Windows
// uscire mentre i socket di `fetch` sono ancora aperti fa abortire Node con
// un assert di libuv e restituisce 127 — cioè uno script di guardia che
// sembra fallito proprio quando è andato bene.
async function main() {
  const file = readdirSync(PAGES_DIR).filter((f) => f.endsWith('.html')).sort();
  const esiti = await Promise.all(file.map(confronta));

  for (const e of esiti) {
    console.log(`${e.diversa ? 'DIVERSA  ' : 'identica '} ${e.slug}`);
  }
  console.log('');

  const cambiate = esiti.filter((e) => e.diversa);
  const inattese = bersaglio
    ? cambiate.filter((e) => e.file !== `${bersaglio}.html`)
    : cambiate;

  if (inattese.length > 0) {
    const nomi = inattese.map((e) => e.slug).join(', ');
    if (!bersaglio) {
      console.error(
        `Pagine che differiscono dall'online: ${nomi}.
Rilancia indicando quale vuoi aggiornare, es.: node scripts/deploy-sicuro.mjs superlotw`,
      );
      return 1;
    }
    const comandi = inattese
      .map((e) => `  curl -s "${BASE}/${e.slug === '(home)' ? '' : e.slug}" | diff src/pages/${e.file} -`)
      .join('\n');
    console.error(
      `STOP: pubblicando cambieresti anche ${nomi}, che non hai dichiarato.
Se il tuo sorgente è più vecchio della pagina online, un deploy la farebbe
tornare indietro. Confronta e allinea prima di riprovare:
${comandi}`,
    );
    return 1;
  }

  if (bersaglio && cambiate.length === 0) {
    console.log(`Nessuna differenza: ${bersaglio} è già online com'è in locale. Niente da pubblicare.`);
    return 0;
  }

  if (soloVerifica) {
    console.log('Verifica superata. Nessun deploy eseguito (--solo-verifica).');
    return 0;
  }

  if (!bersaglio) {
    console.error('Indica quale pagina vuoi pubblicare, es.: node scripts/deploy-sicuro.mjs superlotw');
    return 1;
  }

  console.log(`Solo ${bersaglio} cambia. Pubblico.\n`);
  const deploy = spawnSync('npx', ['wrangler', 'deploy'], {
    cwd: WORKER_DIR,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
  return deploy.status ?? 1;
}

process.exitCode = await main();
