# privacy-policies

Questo repository ha **due ruoli distinti**, e conviene tenerli separati in testa:

| cosa | dove | serve a |
|---|---|---|
| **sorgente** delle informative | `worker/` | è il codice da cui si pubblica |
| **redirect** dei vecchi indirizzi | radice, `superlotw/`, `lumatextfx/` | non rompere i link già in circolazione |

## Le informative pubblicate

- SuperLOTW: <https://privacy.tizianocassone.workers.dev/superlotw>
- LumaText FX: <https://privacy.tizianocassone.workers.dev/lumatextfx>
- RistoQR: <https://privacy.tizianocassone.workers.dev/ristoqr>

Sono servite da un Cloudflare Worker (`privacy`), il cui **sorgente sta in
`worker/`**: una pagina HTML per app in `worker/src/pages/`, più il router in
`worker/src/index.js` che mappa lo slug dell'URL alla pagina.

### Modificare e pubblicare

```bash
cd worker
# modifica src/pages/<app>.html
wrangler deploy --dry-run    # valida senza pubblicare
wrangler deploy
```

Poi **verificare sull'URL pubblico** che il testo nuovo si veda: modificare il
sorgente non è pubblicare. Le pagine hanno `cache-control: max-age=3600`, quindi
una modifica appena distribuita può richiedere fino a un'ora per comparire —
oppure si controlla direttamente lo script deployato.

**Non modificare il Worker dal dashboard di Cloudflare.** Lì si vede il bundle
compilato, e il primo `wrangler deploy` da qui lo sovrascriverebbe: la modifica
andrebbe persa senza che nessuno se ne accorga.

### Aggiungere l'informativa di una nuova app

1. `worker/src/pages/<slug>.html`
2. import e voce in `PAGES` dentro `worker/src/index.js`
3. deploy, e verifica che `/<slug>` risponda
4. allineare l'URL nell'app, nelle schede store di **tutte** le lingue e nel
   campo "Informativa privacy" di Play Console / App Store Connect — quello
   sta fuori da qui e va cambiato a mano

## I redirect (e perché non si cancellano)

Le informative stavano su GitHub Pages, a `wifi75.github.io/privacy-policies/<app>/`.
Quando sono state spostate sul Worker, quelle pagine sono state **sostituite da
redirect** invece di essere rimosse: i link già in circolazione — schede store
non aggiornate, pagine in cache, segnalibri — continuano a funzionare e portano
al testo corrente. Lasciarle col contenuto vecchio avrebbe significato tenere in
linea **due informative divergenti** per la stessa app, che è un problema di
conformità, non un dettaglio estetico.

GitHub Pages non può rispondere con un 301, quindi il rimando usa `canonical` +
`meta refresh` + `script` + un link visibile, con `noindex, follow`.

Questi file non vanno aggiornati col contenuto delle informative: sono solo
cartelli indicatori.

## `_config.yml`: perché esiste

Esclude `worker/` dalla pubblicazione di Pages. Senza, `worker/src/pages/superlotw.html`
sarebbe raggiungibile come pagina pubblica — una **terza** copia live della stessa
informativa, cioè di nuovo il problema che i redirect esistono per evitare.

## Marcatori di versione

Le pagine riportano **"Valida dalla versione X"**, non "Versione app: X". La
differenza non è cosmetica: così il numero invecchia solo quando il **contenuto**
dell'informativa cambia davvero — cioè quando aggiornarla è obbligatorio — e non
ad ogni release dell'app, che sarebbe un rito di manutenzione senza alcun
beneficio per chi legge.

Un'informativa va aggiornata quando cambia il **trattamento dei dati**: un dato
nuovo raccolto, una finalità nuova, un destinatario nuovo, un permesso nuovo. Non
per una correzione di bug, una funzione che lavora su dati già sul dispositivo, o
un numero di versione che avanza.

Le versioni citate **nel corpo del testo** ("dalla versione 1.44.0 la stessa
sincronizzazione legge...") sono **fatti storici**: non si toccano.

## Nessuna richiesta a terzi

Tutte le pagine usano stack di font di sistema e la CSP è
`default-src 'none'; style-src 'unsafe-inline'; img-src data:`. Nessuna pagina
carica niente da nessuno: un'informativa privacy che fa contattare Google al
lettore per essere letta è una contraddizione, e l'IP di chi legge è un dato
personale.
