import indexPage from './pages/index.html';
import ristoqr from './pages/ristoqr.html';
import lumatextfx from './pages/lumatextfx.html';
import superlotw from './pages/superlotw.html';

/// Una pagina per app. Aggiungere un'app = aggiungere l'import qui sopra e la
/// voce qui sotto: la rotta e' lo slug, quindi `/superlotw`.
const PAGES = {
  ristoqr,
  lumatextfx,
  superlotw,
};

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const slug = url.pathname
      .replace(/^\/+|\/+$/g, '')
      .replace(/\.html$/, '')
      .toLowerCase();
    if (slug === '') return html(indexPage);
    if (slug in PAGES) return html(PAGES[slug]);
    return html(notFound(), 404);
  },
};

function html(body, status = 200) {
  return new Response(body, {
    status,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      // Un'informativa cambia due volte l'anno: un'ora di cache toglie
      // traffico inutile e resta abbastanza corta da vedere una correzione
      // in giornata.
      'cache-control': 'public, max-age=3600',
      // Nessuna pagina qui esegue script né carica nulla da terzi:
      // dichiararlo impedisce che un intermediario ce ne infili. Google Fonts
      // era ammesso perché la pagina di SuperLOTW, migrata com'era, li usava;
      // ora usa stack di sistema come le altre due, quindi l'eccezione è
      // stata rimossa. Un'informativa privacy che fa contattare Google al
      // lettore per essere letta è una contraddizione, e l'IP di chi legge è
      // un dato personale: adesso `default-src 'none'` è vero alla lettera.
      'content-security-policy':
        "default-src 'none'; style-src 'unsafe-inline'; img-src data:",
      'x-content-type-options': 'nosniff',
    },
  });
}

function notFound() {
  return `<!doctype html>
<html lang="it"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Pagina non trovata</title>
<style>body{margin:0;font:16px/1.6 -apple-system,"Segoe UI",Roboto,system-ui,sans-serif;
background:#F7F7F8;color:#17161A;display:grid;place-items:center;min-height:100vh;text-align:center;padding:24px}
a{color:#3A5BD9}@media(prefers-color-scheme:dark){body{background:#111014;color:#F2F0F5}a{color:#7C95F0}}</style>
</head><body><div>
<h1>Nessuna informativa a questo indirizzo</h1>
<p><a href="/">Vedi l'elenco delle app</a></p>
</div></body></html>`;
}
