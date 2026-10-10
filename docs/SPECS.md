# Générateur de covers d'applications — Spécifications

> Nom de travail : à définir
> Statut : spécifications V1
> Licence cible : open source (MIT)

---

## 1. Contexte et objectif

Les développeurs ont besoin de visuels de présentation pour leurs applications (portfolio, README GitHub, Product Hunt, LinkedIn). Les produire dans Figma ou Canva est long et peu reproductible.

**Objectif** : une application web gratuite et open source qui génère une cover de présentation à partir de 2 captures d'écran, de quelques textes et d'une couleur de marque.

**Référence visuelle** : trois covers existantes (Portf.app, OngolaPhone, Klivar) qui partagent le même gabarit. Le V1 reproduit ce gabarit.

## 2. Périmètre

### 2.1 Dans le V1
- Un seul template (gabarit des 3 covers de référence)
- Édition du contenu : textes, chips, captures
- Couleur de marque unique, dont toute la palette est dérivée
- Prévisualisation en direct
- Export PNG 2400×1500

### 2.2 Hors V1
- Plusieurs templates
- Autres ratios d'export
- ~~Localisation / multi-langues~~ : livrée en fr/en, voir [I18N.md](./I18N.md)
- CLI et GitHub Action
- Comptes utilisateurs, sauvegarde cloud, backend applicatif (seul le service de capture d'URL, facultatif et sans état, fait exception : voir 6.7)

### 2.3 Non-objectifs
- Ce n'est pas un éditeur de design libre (pas de drag & drop d'éléments)
- Ce n'est pas un générateur de screenshots pour les stores (App Store / Play Store)

## 3. Principes

1. **100 % côté client** : aucune image n'est envoyée à un serveur. Seule exception, facultative : la capture depuis une URL (6.7) envoie l'**adresse saisie** au service de capture. Les images importées, elles, ne quittent jamais le navigateur.
2. **Sans compte** : l'utilisateur ouvre la page et exporte.
3. **Un seul champ obligatoire de style** : la couleur de marque. Le reste est dérivé.
4. **Template = composant + schéma de props**, pour permettre la contribution par PR plus tard.
5. **Aucun asset sous licence** : cadres navigateur et téléphone dessinés en SVG/CSS.

## 4. Anatomie du gabarit

Canevas de **2400 × 1500 px** (16:10). Les valeurs ci-dessous sont mesurées sur les covers de référence et à ajuster à l'implémentation.

```
┌────────────────────────────────────────────────────────────────────┐
│ fond : dégradé + grille + halo (haut-droite)                       │
│                                                                    │
│  [PASTILLE]                    ┌───────────────────────────┐       │
│                                │ ● ● ●  [🔒 url]           │       │
│  Nom                           │                           │       │
│  Description                   │   capture desktop         │       │
│  sur 3 lignes                  │                      ┌────┴────┐  │
│                                │                      │ mobile  │  │
│  [chip] [chip]                 └──────────────────────│         │  │
│  [chip] [chip]                                        └─────────┘  │
│                                                                    │
│  pied de page                                                      │
└────────────────────────────────────────────────────────────────────┘
```

| Zone | Position approximative (px) |
|---|---|
| Colonne gauche | x = 135, largeur ≈ 720 |
| Pastille | y ≈ 285 à 346 |
| Nom | y ≈ 400 à 500, corps ≈ 110 px |
| Description | sous le nom, corps ≈ 32 px, 3 lignes |
| Chips | sous la description, retour à la ligne automatique |
| Pied de page | y ≈ 1375 |
| Navigateur | x ≈ 900 à 2190, y ≈ 180 à 1100/1170 |
| Téléphone | x ≈ 1907 à 2308, y ≈ 510 à 1430 |

Éléments fixes : feux tricolores du navigateur, barre d'URL avec cadenas, cadre noir du téléphone avec dynamic island, typographie, espacements, forme de la pastille (contour arrondi) et des chips (fond blanc translucide).

## 5. Modèle de données

```ts
type CoverConfig = {
  content: {
    badge: string;            // affiché en majuscules espacées
    nameMain: string;         // 1re partie du nom
    nameAccent?: string;      // 2e partie, optionnelle (ex. "Ongola" + "Phone")
    description: string;
    chips: string[];          // liste dynamique, nombre libre
    footer: string;           // texte libre (ex. "klivar.fr · Tech Lead")
    browserUrl: string;       // URL affichée dans la barre du navigateur
  };
  style: {
    brandColor: string;       // hex, seul champ obligatoire
    accentColor?: string;     // override de la couleur de nameAccent (V1.1)
    haloIntensity?: number;   // 0–1 (V1.1)
    gridOpacity?: number;     // 0–1, 0 = désactivée (V1.1)
  };
  mockups: {
    desktopImage?: ImageAsset;
    mobileImage?: ImageAsset;
    browserTheme?: "auto" | "light" | "dark";   // V1.1
    desktopCropY?: number;                       // décalage vertical, 0–1 (V1.1)
  };
  layout?: {                                     // V2
    mirror?: boolean;                            // texte à droite, mockups à gauche
    phonePosition?: "bottom-right" | "bottom-left";
  };
  export: {
    format: "png";
    scale: 1 | 2;
  };
};

type ImageAsset = {
  dataUrl: string;
  width: number;
  height: number;
};
```

## 6. Fonctionnalités

### 6.1 Contenu (V1)

| Champ | Type | Contrainte |
|---|---|---|
| Pastille | texte | max ~40 caractères, transformée en majuscules par le template |
| Nom (partie 1) | texte | obligatoire |
| Nom (partie 2) | texte | optionnel |
| Description | texte multi-lignes | max ~160 caractères recommandés |
| Chips | liste | ajout / suppression, nombre libre, retour à la ligne automatique |
| Pied de page | texte | libre |
| URL navigateur | texte | indépendant du pied de page |

### 6.2 Mockups (V1)

- Upload séparé de la capture desktop et de la capture mobile (PNG, JPEG, WebP)
- Chaque mockup est optionnel : le gabarit doit rester valide avec desktop seul, mobile seul, ou les deux
- Hauteur du navigateur : suit le ratio de la capture, bornée par un minimum et un maximum
- La capture est affichée depuis le haut de page (`object-fit: cover`, ancrage haut)
- Si aucune image n'est fournie : placeholder neutre

### 6.3 Couleurs (V1)

Une couleur de marque en entrée (color picker + saisie hex). Le template en dérive toute sa palette (cf. §7).

### 6.4 Export (V1)

- Bouton « Télécharger PNG »
- Taille de sortie : 2400×1500 (échelle 1×)
- Nom de fichier : `<nameMain><nameAccent>-cover.png`, normalisé en minuscules sans espaces

### 6.5 Ajouts V1.1

- Thème du navigateur : clair, sombre, ou auto (selon la luminosité moyenne de la capture)
- Override de la couleur de la 2e partie du nom
- Réglage du halo et de la grille
- Recadrage vertical de la capture desktop

### 6.6 Ajouts V2

- Inversion du layout et position du téléphone
- Ratios d'export supplémentaires : 1:1, 1.91:1 (image OG), 16:9
- Plusieurs templates
- Facteur d'échelle 2×

### 6.7 Capture depuis une URL

L'utilisateur colle l'adresse de son site au lieu d'importer des fichiers.

1. **Analyse** : le service liste les pages du site (sitemap, puis liens de la page d'accueil, puis rendu Chrome si le site est une SPA). Un seul niveau, 50 pages au plus, groupées (accueil, navigation, pages, blog, légal).
2. **Choix** : l'utilisateur coche les pages et les appareils (desktop, mobile). Un clic sur « Aperçu » affiche la capture desktop réduite ; elle est gardée en mémoire et réutilisée si la page est cochée.
3. **Capture** : une image WebP par page et par appareil, qui suit ensuite le même chemin qu'un fichier importé (`readImage`, galerie, placement par orientation).

Contraintes :
- Le service est un projet Vercel séparé (`capture/`), sans état ; l'app reste un export statique.
- La fonctionnalité n'apparaît que si `NEXT_PUBLIC_CAPTURE_ENDPOINT` est défini : un fork reste 100 % local.
- Les pages derrière connexion et les sites protégés contre les robots ne sont pas capturables ; l'import manuel reste la voie de repli.

Contrat d'API, sécurité et déploiement : [CAPTURE.md](./CAPTURE.md).

### 6.8 Édition directe sur l'aperçu

Textes modifiables sur place et barre d'outils flottante (taille, police, couleur par élément), à la manière de Canva. Le panneau reste la voie complète. Spécification : [INLINE-EDITING.md](./INLINE-EDITING.md).

## 7. Dérivation de la palette

À partir de `brandColor` (converti en HSL ou OKLCH) :

| Élément | Règle |
|---|---|
| Fond bas-gauche | même teinte, luminosité ≈ 10 % |
| Fond haut-droite | `brandColor` |
| Halo | teinte plus claire et saturée, flou large, positionné en haut à droite |
| Pastille, chips | blanc à ≈ 8 % d'opacité |
| Bouton, accents | `brandColor` éclaircie |
| Couleur de `nameAccent` | auto : teinte claire sur fond sombre ; teinte foncée si le fond est vif |

**Contraste** : la luminance relative de la couleur de fond est calculée. Si le ratio de contraste du texte blanc passe sous 4,5:1 (WCAG AA), le fond est assombri jusqu'à atteindre le seuil. Cas à tester : jaune, cyan, blanc cassé, noir pur.

## 8. Architecture technique

### 8.1 Stack

- **Vite + React + TypeScript**
- **Tailwind CSS** pour l'interface de l'éditeur
- **modern-screenshot** pour l'export PNG
- Aucun backend ; hébergement statique (Vercel, Netlify ou GitHub Pages)

### 8.2 Rendu

- Le template est un composant React rendu à **2400×1500 px** réels.
- La prévisualisation l'enveloppe dans un conteneur et applique `transform: scale()` pour tenir dans l'écran.
- L'export capture le composant **à sa taille native**, hors du `scale` de prévisualisation.

### 8.3 Structure du dépôt

```
/
├─ src/
│  ├─ app/                  # shell de l'éditeur (formulaire + preview)
│  ├─ templates/
│  │  └─ showcase/          # template V1
│  │     ├─ Template.tsx
│  │     ├─ schema.ts       # schéma des props du template
│  │     └─ palette.ts      # dérivation des couleurs
│  ├─ mockups/
│  │  ├─ BrowserFrame.tsx   # SVG/CSS
│  │  └─ PhoneFrame.tsx     # SVG/CSS
│  ├─ lib/
│  │  ├─ color.ts           # HSL/OKLCH, luminance, contraste
│  │  ├─ export.ts          # modern-screenshot, capture du DOM
│  │  └─ image.ts           # lecture fichier, dimensions, validation
│  └─ fonts/                # polices auto-hébergées
├─ public/
├─ SPECS.md
├─ README.md
├─ CONTRIBUTING.md
└─ LICENSE
```

### 8.4 Contrat d'un template

```ts
type Template = {
  id: string;
  name: string;
  size: { width: number; height: number };
  component: React.ComponentType<{ config: CoverConfig }>;
  schema: FieldSchema[];       // champs exposés à l'éditeur
};
```

Un template ajouté = un dossier dans `src/templates/` + une entrée dans le registre. L'éditeur génère son formulaire à partir de `schema`.

## 9. Interface de l'éditeur

- Disposition en 2 zones : **formulaire à gauche, prévisualisation à droite** ; en mobile, la prévisualisation passe au-dessus.
- Sections du formulaire : Contenu, Couleurs, Captures, Export.
- Mise à jour de la prévisualisation en temps réel, sans bouton « Appliquer ».
- Valeurs par défaut : un exemple pré-rempli (placeholder) pour que le rendu soit visible dès l'ouverture.
- Persistance : `localStorage` du texte et des couleurs. Les images ne sont pas persistées en V1 (poids).

## 10. Contraintes techniques

| Sujet | Exigence |
|---|---|
| Polices | Auto-hébergées et embarquées à l'export (sinon la capture les perd). Attendre `document.fonts.ready` avant de capturer. |
| Images | Lues via `FileReader` en data URL, pas de requête réseau. Taille max suggérée : 10 Mo par image. |
| Formats acceptés | PNG, JPEG, WebP |
| Mémoire | Un canevas 2400×1500 en 2× fait 4800×3000 ; prévoir un message d'erreur si le navigateur refuse la capture. |
| Navigateurs cibles | Chrome, Edge, Firefox, Safari récents |
| Safari | Export via `modern-screenshot` (redessine les images pour Safari/iOS) : à vérifier sur un vrai iPhone |
| Accessibilité | Éditeur navigable au clavier, labels de formulaire, contraste de l'interface conforme AA |

## 11. Critères d'acceptation V1

- [ ] Reproduire les 3 covers de référence (Portf.app, OngolaPhone, Klivar) avec un écart visuel limité aux captures et aux polices
- [ ] Changer la couleur de marque met à jour fond, halo, chips et accents sans autre réglage
- [ ] Le texte reste lisible sur au moins : indigo, orange, violet, vert, jaune, rouge, noir
- [ ] Le gabarit s'affiche correctement avec : desktop seul, mobile seul, les deux, aucune image
- [ ] Ajouter jusqu'à 8 chips ne casse pas la mise en page
- [ ] Un nom de 30 caractères ne déborde pas de la colonne gauche
- [ ] L'export PNG fait exactement 2400×1500 px et contient les bonnes polices
- [ ] Aucun appel réseau n'est émis lors de l'upload ou de l'export (vérifiable dans l'onglet Network)
- [ ] Le temps d'export reste sous 3 secondes sur un ordinateur courant

## 12. Open source

- **Licence** : MIT
- **Dépôt** : README avec capture, démo en ligne, instructions d'installation (`pnpm install && pnpm dev`)
- **CONTRIBUTING.md** : guide « créer un template » (structure du dossier, schéma, enregistrement dans le registre, capture de preview obligatoire)
- **Polices** : uniquement sous licence libre (ex. OFL), licences listées dans le dépôt
- **Mockups** : dessinés dans le projet, sans reproduction des cadres officiels d'appareils (Apple, Google), ce qui évite les questions de licence

## 13. Feuille de route

| Version | Contenu |
|---|---|
| **V1** | Template unique, contenu complet, couleur de marque, 2 captures, export PNG 2400×1500 |
| **V1.1** | Thème navigateur, override de la couleur du nom, halo et grille, recadrage vertical |
| **V2** | Inversion de layout, ratios supplémentaires, échelle 2×, système multi-templates, premiers templates communautaires |
| **Plus tard** | CLI / GitHub Action, export WebP |

## 14. Risques

| Risque | Impact | Mitigation |
|---|---|---|
| Polices absentes de l'export | Rendu différent de la preview | Auto-hébergement, `document.fonts.ready`, test d'export en CI manuel |
| Contraste insuffisant sur couleurs claires | Texte illisible | Calcul de luminance et assombrissement automatique du fond |
| Export lent ou en échec sur mobile | Mauvaise expérience | Message d'erreur explicite, recommander desktop pour l'export |
| Un seul template : peu d'intérêt pour la communauté | Faible adoption | Soigner le template V1, documenter la contribution dès V1 |
| Divergence entre rendu preview et export | Perte de confiance | Rendre la preview à partir du même composant que l'export |
| Service de capture détourné (SSRF, abus) | Accès au réseau interne, coûts | Filtre d'adresses à chaque requête et redirection, origines autorisées, rate limiting Vercel, plafond de dépense |

## 15. Questions ouvertes

- Nom du projet et domaine
- Police du template (à choisir parmi des polices libres proches des covers de référence)
- Support des captures animées (GIF) : exclu du V1
- Ajout d'un logo d'application dans le gabarit : non prévu en V1 ; à trancher
