# Contribuer à Cover Studio

Merci de votre intérêt ! Ce guide explique comment proposer une amélioration.

En participant, vous acceptez le [code de conduite](./CODE_OF_CONDUCT.md). Vos contributions sont
publiées sous la [licence MIT](./LICENSE) du projet.

## Avant de commencer

- Pour un bug : cherchez d'abord dans les [issues](https://github.com/roosveltkn/cover-studio/issues),
  puis ouvrez-en une avec le modèle « Bug ».
- Pour une nouvelle fonctionnalité : ouvrez une issue « Fonctionnalité » **avant** de coder, pour
  vérifier qu'elle entre dans le périmètre (voir `docs/SPECS.md`, section « Non-objectifs »).
- Les issues `good first issue` et `help wanted` sont un bon point de départ.

## Installation

Prérequis : Node.js 20+ et pnpm 10.

```bash
git clone https://github.com/<votre-compte>/cover-studio.git
cd cover-studio
pnpm install
pnpm dev
```

> **Attention** : cette version de Next.js comporte des changements incompatibles avec ce que vous
> connaissez peut-être. Consultez la documentation locale dans `node_modules/next/dist/docs/`
> avant de toucher aux conventions de routage ou de configuration (voir aussi `AGENTS.md`).

## Workflow

1. Forkez le dépôt et créez une branche depuis `develop` : `feat/nom-court` ou `fix/nom-court`.
2. Faites des changements ciblés : une PR = un sujet.
3. Avant de pousser, lancez :

   ```bash
   pnpm lint
   pnpm typecheck
   pnpm i18n:check
   pnpm build
   pnpm format
   ```

   La CI exécute les quatre premières commandes ; une PR ne peut être fusionnée que si elles passent.
4. Ouvrez une PR vers `develop` (la branche de preview ; `main` ne reçoit que les releases) en remplissant le modèle. Pour tout changement visuel, joignez une
   capture d'écran ou une cover exportée avant / après.

## Conventions

- **Commits** : [Conventional Commits](https://www.conventionalcommits.org/fr/) (`feat:`, `fix:`,
  `docs:`, `refactor:`, `chore:`…), à l'impératif ou à l'infinitif, en français ou en anglais.
- **Code** : TypeScript strict, Prettier (`pnpm format`), imports via l'alias `@/`.
  Commentaires en français, comme dans le reste du code.
- **Textes de l'interface** : jamais en dur dans les composants. Ajoutez la clé dans
  `messages/fr.json` **et** `messages/en.json`, puis lancez `pnpm i18n:check`. Détails dans
  [docs/I18N.md](./docs/I18N.md).
- **Aucun asset sous licence** : cadres, icônes et illustrations doivent être dessinés par vous
  ou libres de droits compatibles MIT (indiquez la source dans la PR). Pas de logo de marque ni de
  capture d'application tierce sans autorisation.
- **100 % côté client** : pas de backend, pas d'envoi d'images à un serveur, pas de traceur.
- **Dépendances** : ajoutez-en le moins possible et justifiez-les dans la PR.

## Ajouter un modèle

Un modèle = un composant React + un schéma de champs + une entrée dans le registre.

1. Créez `templates/<mon-modele>/Template.tsx` exportant un composant qui reçoit
   `{ config: PlacedConfig }` (voir `types/cover.ts`). Le canevas fait `COVER_SIZE`
   (`templates/shared/mockups.ts`) ; dessinez tout en pixels sur cette taille, l'aperçu et l'export
   se chargent de la mise à l'échelle.
2. Réutilisez les briques existantes : `templates/shared/` (blocs de texte, mockups),
   `mockups/BrowserFrame.tsx` et `mockups/PhoneFrame.tsx`, et `lib/color.ts` pour dériver la palette
   de `style.brandColor`.
3. Choisissez un schéma de champs : `baseSchema` (navigateur + téléphone) ou `mobileTrioSchema`
   (3 téléphones), ou créez-en un dans `templates/shared/schema.ts`.
4. Déclarez les emplacements de captures (`slots`) : `BROWSER_AND_PHONE`, `THREE_PHONES` ou les vôtres.
5. Enregistrez le modèle dans `templates/registry.ts` (`id`, `nameKey`, `descriptionKey`, `size`,
   `component`, `schema`, `slots`).
6. Ajoutez son nom et sa description dans le namespace `templates` de `messages/fr.json` et
   `messages/en.json`.
7. Vérifiez : `pnpm dev`, ouvrez l'éditeur, testez avec 0, 1 et plusieurs captures, des textes longs
   et plusieurs couleurs de marque, en clair et en sombre. Exportez un PNG et vérifiez qu'il
   correspond à l'aperçu. Joignez-le à la PR.

## Ajouter une langue

Suivez la section « Ajouter une langue » de [docs/I18N.md](./docs/I18N.md).

## Revue

Un mainteneur relira votre PR dès que possible. Soyez prêt à itérer : des retours ne sont pas un
rejet. Les PR sont fusionnées en « squash » ; le titre de la PR devient le message de commit, donc
respectez Conventional Commits.

## Sécurité

Ne signalez pas une faille dans une issue publique : voir [SECURITY.md](./SECURITY.md).
