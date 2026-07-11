# OpeningBook

Copyright © Riadh MNASRI. All rights reserved.

A personal chess opening repertoire manager, in the spirit of ChessBase:
store your openings with every variation, annotate them, and study them on
an interactive board with Stockfish analysis and live opening theory.

*La version française suit plus bas.*

## English

### What it does

- **Family profiles**: each player of the household has their own space
  with their own repertoires. No account, no friction.
- **Repertoires per color**: a repertoire is built for White or for Black,
  and the board is oriented accordingly.
- **Position graph, not move lists**: internally a repertoire is a graph of
  positions keyed by normalized FEN. Two move orders reaching the same
  position share every continuation, so **transpositions are detected
  automatically** and shown as such in the move tree.
- **Board-first editing**: play a move on the board and it is added to the
  tree (or navigated to if it already exists). Nested variations are
  displayed like a book and every move is clickable. Keyboard navigation
  with the arrow keys.
- **Annotations**: mark moves with standard glyphs (!, !?, ?!, ?, ...),
  attach a comment to any move and a free note to any position. Promote a
  variation to main move in one click. Everything autosaves.
- **Stockfish analysis**: the engine runs locally in your browser
  (WebAssembly) with an evaluation bar and the top three lines, updated as
  you navigate. No server, no cost.
- **Opening theory**: for the current position, see what masters and club
  players actually play (lichess opening explorer), with result statistics
  and the ECO opening name. One click on a theory move adds it to your
  repertoire.

### Tech notes

- Next.js (App Router) + TypeScript + Tailwind CSS.
- Hexagonal architecture: pure domain (position graph, FEN normalization,
  transposition detection) covered by unit tests, use cases behind ports,
  Postgres (Neon) and JSON-file adapters.
- chess.js for rules, react-chessboard for the board, Stockfish compiled
  to WebAssembly for analysis, lichess opening explorer API for theory.
- Runs against Neon Postgres when `DATABASE_URL` is set, or against local
  JSON files under `.data/` with zero setup otherwise.

### Run locally

```bash
npm install
npm run dev     # http://localhost:3344
npm test        # unit tests
```

Opening names (ECO) work out of the box from an embedded dataset
([lichess-org/chess-openings](https://github.com/lichess-org/chess-openings),
CC0; regenerate with `node scripts/build-eco.mjs`). The theory statistics
panel requires a free lichess personal access token (the lichess explorer
API requires authentication): create one at
[lichess.org/account/oauth/token](https://lichess.org/account/oauth/token)
(no scopes needed) and set it as `LICHESS_API_TOKEN` in `.env.local`. The
token stays server-side; explorer calls are proxied and cached.

## Français

### Ce que fait l'application

- **Profils familiaux** : chaque joueur de la maison a son espace et ses
  répertoires. Pas de compte, pas de friction.
- **Répertoires par couleur** : un répertoire se construit avec les Blancs
  ou avec les Noirs, l'échiquier s'oriente en conséquence.
- **Un graphe de positions, pas des listes de coups** : en interne, un
  répertoire est un graphe de positions indexées par FEN normalisé. Deux
  ordres de coups menant à la même position partagent toutes leurs suites :
  **les transpositions sont détectées automatiquement** et signalées dans
  l'arbre des coups.
- **Édition sur l'échiquier** : jouez un coup sur l'échiquier et il
  s'ajoute à l'arbre (ou vous y naviguez s'il existe déjà). Les variantes
  imbriquées s'affichent comme dans un livre et chaque coup est cliquable.
  Navigation au clavier avec les flèches.
- **Annotations** : glyphes standards (!, !?, ?!, ?, ...), commentaire sur
  chaque coup, note libre sur chaque position, promotion d'une variante en
  coup principal en un clic. Tout est enregistré automatiquement.
- **Analyse Stockfish** : le moteur tourne localement dans le navigateur
  (WebAssembly), avec barre d'évaluation et les trois meilleures lignes,
  mises à jour au fil de la navigation.
- **Théorie** : pour la position courante, ce que jouent réellement les
  maîtres et les joueurs de club (explorer lichess), avec statistiques de
  résultats et nom d'ouverture ECO. Un clic sur un coup de théorie l'ajoute
  au répertoire.

### Lancer en local

```bash
npm install
npm run dev     # http://localhost:3344
npm test        # tests unitaires
```
