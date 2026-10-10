# Cover Studio

Générateur gratuit et open source de covers pour vos applications : importez vos captures d'écran,
choisissez un modèle et une couleur de marque, exportez un PNG prêt à partager (README GitHub,
Product Hunt, LinkedIn, portfolio).

_English: a free, open-source cover generator for your app. Drop in screenshots (or let it capture your site from its URL), pick a template and a brand colour, export a ready-to-share PNG. Everything runs in your browser._

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![CI](https://github.com/roosveltkn/cover-studio/actions/workflows/ci.yml/badge.svg)](https://github.com/roosveltkn/cover-studio/actions/workflows/ci.yml)

## Fonctionnalités

- 5 modèles (showcase, spotlight, bento, perspective, mobile-trio)
- Captures multiples (jusqu'à 4), réordonnables par glisser-déposer
- Capture depuis une URL : le site est analysé, vous choisissez les pages, elles sont capturées
  en version ordinateur et mobile (service facultatif, voir [docs/CAPTURE.md](./docs/CAPTURE.md))
- Une couleur de marque : toute la palette en est dérivée
- Textes, icône de l'application, typographie et tailles réglables
- Export PNG en plusieurs formats et en haute résolution
- Interface en français et en anglais, thème clair / sombre
- **100 % côté client** : aucune image n'est envoyée à un serveur, aucun compte requis. Seule
  exception, facultative : la capture depuis une URL envoie l'adresse saisie au service de capture

## Démarrage rapide

Prérequis : [Node.js](https://nodejs.org) 20 ou plus et [pnpm](https://pnpm.io) 10.

```bash
git clone https://github.com/roosveltkn/cover-studio.git
cd cover-studio
pnpm install
pnpm dev
```

Ouvrez <http://localhost:3000>.

## Scripts

| Commande          | Rôle                                                   |
| ----------------- | ------------------------------------------------------ |
| `pnpm dev`        | serveur de développement                               |
| `pnpm build`      | build de production (export statique dans `out/`)      |
| `pnpm lint`       | ESLint                                                 |
| `pnpm typecheck`  | vérification TypeScript                                |
| `pnpm format`     | formatage Prettier                                     |
| `pnpm i18n:check` | cohérence des traductions (clés, variables, textes en dur) |
| `pnpm test`       | tests unitaires (Vitest)                               |
| `pnpm test:e2e`   | build puis tests de bout en bout (Playwright)          |
| `pnpm capture:dev` | service de capture en local (`vercel dev`)            |
| `pnpm capture:test` | tests du service de capture                          |

## Stack

[Next.js](https://nextjs.org) (App Router, export statique) · React 19 · TypeScript ·
Tailwind CSS 4 · shadcn/ui · Zustand · modern-screenshot · dnd-kit.

## Structure du projet

```
app/          pages (landing, éditeur) et métadonnées SEO
components/   éditeur, landing et composants UI
templates/    un dossier par modèle de cover + registre (registry.ts)
mockups/      cadres navigateur et téléphone (SVG / CSS)
stores/       état de l'éditeur (Zustand)
lib/          logique pure : couleurs, images, export
i18n/         traducteur maison ; textes dans messages/{fr,en}.json
capture/      service de capture d'URL (projet Vercel séparé, Chrome headless)
docs/         spécifications (SPECS.md), internationalisation (I18N.md), capture (CAPTURE.md)
```

## Contribuer

Les contributions sont les bienvenues : nouveaux modèles, formats d'export, langues, corrections.
Lisez [CONTRIBUTING.md](./CONTRIBUTING.md), en particulier la section
[Ajouter un modèle](./CONTRIBUTING.md#ajouter-un-modèle), et le
[code de conduite](./CODE_OF_CONDUCT.md).

Une faille de sécurité ? Voir [SECURITY.md](./SECURITY.md).

## Licence

[MIT](./LICENSE) © Roosvelt Kenne
