# Édition directe sur la cover — Spécifications

> Statut : niveaux 1 et 2 implémentés
> Complète [SPECS.md](./SPECS.md) §6 et §9

---

## 1. Objectif

Modifier les textes **directement sur l'aperçu**, comme dans Canva : on clique sur le nom, on tape, et une barre d'outils flottante règle la taille, la police et la couleur de l'élément sélectionné. Le panneau de gauche reste la voie complète et accessible ; l'édition directe s'ajoute, elle ne remplace rien.

## 2. Périmètre

### 2.1 Niveau 1 — texte modifiable sur place
- Survol d'un texte de l'aperçu principal : contour fin, curseur texte.
- **Clic** sur un texte non sélectionné : il est sélectionné (cadre + barre d'outils).
- **Clic sur le texte sélectionné, double-clic, ou Entrée** au clavier : passage en saisie, curseur placé au point cliqué (en fin de texte au clavier).
- La saisie met à jour la cover et le panneau en direct (même champ `content.*` que le formulaire).
- **Entrée** ou **Échap** valident et quittent la saisie ; un clic ailleurs aussi. **Échap** hors saisie désélectionne (sauf depuis un champ du panneau ou une fenêtre ouverte).
- Clic sur le fond de la scène (hors cover) : désélection.
- Textes concernés : pastille (`badge`), nom (`nameMain`, `nameAccent`), description, chips (une par une), pied de page (`footer`).
- Le champ correspondant du panneau est mis en évidence quand un élément est sélectionné.

### 2.2 Niveau 2 — barre d'outils contextuelle
Affichée au-dessus de l'élément sélectionné (en dessous s'il manque de place), dans la fenêtre :
- **Taille** : − / pourcentage / +, réinitialisation. Écrit `style.textScale[élément]` (déjà existant, bornes `SCALE_MIN`–`SCALE_MAX`).
- **Police** : police du modèle (par défaut) ou une des `FONTS`. Écrit `style.textFont[élément]`.
- **Couleur** : sélecteur + couleurs suggérées, réinitialisation. Écrit `style.textColor[élément]`.
- **Modifier le texte** : passe en saisie (utile au clavier et au tactile).
- Cliquer dans la barre ne fait pas perdre le focus du texte en saisie : on peut changer la taille en tapant.
- **Fermer** : désélectionne.

Les réglages valent pour l'**élément** (toutes les chips ensemble, le nom entier), pas pour une seule chip.

### 2.3 Hors périmètre (niveau 3, plus tard)
Déplacement, redimensionnement par poignées, rotation, repères magnétiques, ajout d'éléments libres, annuler/rétablir (`zundo`), suppression d'un texte depuis la barre.

## 3. Règles de saisie

| Règle | Comportement |
|---|---|
| Texte brut | `contentEditable="plaintext-only"` : pas de mise en forme collée. |
| Une seule ligne | Les retours à la ligne (saisis ou collés) deviennent des espaces. |
| Longueur maximale | Celle du schéma du template (`maxLength`), appliquée pendant la frappe. |
| Texte vidé | Pas écrit dans le store pendant la saisie (l'élément disparaîtrait sous le curseur) ; à la validation : le nom principal (obligatoire) reprend sa valeur d'origine, une chip vide est retirée, les autres champs deviennent vides et l'élément disparaît. |
| Description | Le rognage à N lignes (`line-clamp`) est levé pendant la saisie dans `TextBlock` ; les templates à texte spécifique le gardent. |
| Accent du nom | La couleur personnalisée du nom s'applique à la partie principale ; l'accent garde la couleur d'accent du template. |

## 4. Modèle de données

Ajouts à `CoverConfig["style"]`, persistés comme le reste du style :

```ts
textFont?: Partial<Record<TextElement, string>>   // id de police (lib/fonts)
textColor?: Partial<Record<TextElement, string>>  // hex
```

État d'interface dans le store, **non persisté** :

```ts
selection: { element: TextElement; path: string } | null   // path : "content.badge", "content.chips.2"…
editing: boolean
```

## 5. Architecture

- **`templates/shared/editable.tsx`** : `EditingContext` et `<EditableText field index? />`. Les templates restent indépendants du store : le contexte apporte les rappels (`select`, `startEditing`, `update`, `commit`) et `maxLength`.
  - Sans contexte (miniatures, aperçu non principal) : rendu identique à aujourd'hui, plus un `<span>` stylé seulement si une police ou une couleur personnalisée existe — elle doit apparaître dans les miniatures et l'export.
  - Avec contexte : `<span data-edit-path>` cliquable ; en saisie, le span est remonté (clé différente) et **non contrôlé** par React (texte posé à l'entrée, lu à chaque `input`) pour ne pas perdre le curseur.
- **`TextBlock`, `Chips`, `Footer`** utilisent `EditableText` : 11 templates couverts d'un coup ; brutal, editorial, poster, store et terminal sont adaptés à la main.
- **`components/editor/inline-editing.tsx`** : fournit le contexte à partir du store, calcule le cadre de sélection (`getBoundingClientRect`, `ResizeObserver`) et affiche la barre d'outils dans un portail en position fixe.
- **Export** : le cadre et la barre sont **hors** du nœud exporté ; le contour de survol est un `outline` CSS (non présent à l'export, la souris étant sur le bouton). La sélection est vidée avant l'export.
- Seul l'aperçu principal (`CanvasStage`) active l'édition ; `FitPreview` ne la reçoit jamais.

## 6. Accessibilité

- Les textes modifiables sont focusables (`tabIndex=0`, `role="button"`, `aria-label` = libellé du champ) ; Entrée passe en saisie (`role="textbox"`).
- La barre d'outils est un `role="toolbar"` étiqueté, boutons nommés, textes dans `messages/*.json`.
- Le panneau garde toutes les fonctions : l'édition directe n'est jamais la seule voie.

## 7. Critères d'acceptation

1. Cliquer puis taper sur le nom d'une cover change le nom dans l'aperçu et dans le champ du panneau.
2. Entrée valide ; Échap désélectionne ; le PNG exporté ne contient ni cadre ni barre.
3. La barre change taille, police et couleur de l'élément ; les miniatures et l'export reflètent ces réglages.
4. Les 16 templates exposent leurs textes à l'édition directe (test de contrat).
5. Aucun texte d'interface en dur ; `pnpm i18n:check`, `typecheck`, `lint`, tests unitaires et E2E passent.
