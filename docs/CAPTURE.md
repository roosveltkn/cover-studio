# Service de capture d'URL

Le service `capture/` liste les pages d'un site et en fait des captures d'écran. C'est un projet Vercel séparé : l'app Cover Studio reste un export statique et l'appelle seulement si `NEXT_PUBLIC_CAPTURE_ENDPOINT` est défini. Ce document fait foi pour les deux côtés : le service l'implémente et `lib/capture.ts` le consomme.

## Vue d'ensemble

```
App (statique)                                Service capture/ (Vercel Functions)
──────────────                                ──────────────────────────────────
« Analyser »  ── GET /api/discover?url= ──▶   robots.txt → sitemaps → liens de l'accueil
                                              → rendu Chrome si SPA → liste JSON
« Aperçu »    ── GET /api/capture?url=&device=desktop ──▶  Chrome headless → WebP
« Capturer »  ── GET /api/capture?… (2 en parallèle max) ──▶  WebP
              ◀── image/webp, mise en cache 24 h par le CDN Vercel
```

L'image reçue passe ensuite par `readImage()` (`lib/image.ts`) comme un fichier importé.

## Endpoints

Les deux endpoints acceptent `GET` (et `OPTIONS` pour le préflight CORS). Les paramètres passent dans la query string, ce qui permet au CDN de mettre la réponse en cache par URL.

### `GET /api/discover?url=<adresse>`

Réponse `200 application/json` :

```ts
type DiscoverResponse = {
  /** Adresse de la page d'accueil après redirections. */
  site: string
  /** Pages retenues, dans l'ordre d'affichage conseillé (50 au plus). */
  pages: DiscoveredPage[]
  /** Nombre de pages trouvées avant plafonnement. */
  total: number
  /** Métadonnées de la page d'accueil, pour préremplir la cover. */
  meta: {
    title?: string
    description?: string
    themeColor?: string
    lang?: string
  }
}

type DiscoveredPage = {
  url: string
  /** Chemin affichable : "/", "/pricing". */
  path: string
  /** Texte du lien de navigation, ou chemin humanisé ; null pour l'accueil sans libellé. */
  label: string | null
  group: "home" | "navigation" | "pages" | "blog" | "legal"
  source: "nav" | "link" | "sitemap" | "render"
}
```

Ordre de recherche, du moins coûteux au plus coûteux :

1. Page d'accueil en `fetch` simple (sans navigateur) : liens `<a href>` du même site. Ceux de `<nav>` et `<header>` forment le groupe `navigation`.
2. `robots.txt` : lignes `Sitemap:`. À défaut, `/sitemap.xml`. Les sitemaps index sont suivis (5 fichiers, 1 000 URL au plus).
3. Si l'accueil contient moins de 3 liens internes (SPA rendue en JS) : rendu Chrome et lecture des liens du DOM.

Nettoyage : URL sans fragment ni query string, slash final retiré, dédoublonnage, exclusion des fichiers (`.pdf`, images, flux…), des pages de connexion et d'administration, de la pagination et des taxonomies. Quand le site a plusieurs langues en préfixe (`/fr/…`, `/en/…`), seule la langue de l'accueil est gardée. Le groupe `blog` est limité à 15 entrées.

Cache CDN : `s-maxage=3600`.

### `GET /api/capture?url=<adresse>&device=desktop|mobile`

| Appareil  | Viewport                    | Échelle | Image produite                        |
| --------- | --------------------------- | ------- | ------------------------------------- |
| `desktop` | 1440×900                    | 2       | 2880×1800, paysage → cadre navigateur |
| `mobile`  | 390×844, tactile, UA iPhone | 3       | 1170×2532, portrait → cadre téléphone |

Réponse `200 image/webp`. L'en-tête `X-Capture-Url` (exposé en CORS) donne l'adresse finale après redirections.

Avant la capture : `prefers-reduced-motion`, défilement pour déclencher le lazy-load, attente des polices, masquage des bannières cookies (scripts des CMP courants bloqués, sélecteurs connus masqués, éléments fixes parlant de cookies retirés).

Cache CDN : `s-maxage=86400`.

### Erreurs

Toute erreur renvoie du JSON `{ "code": CaptureErrorCode }`, sans cache :

| Code               | Statut | Cas                                                                                           |
| ------------------ | ------ | --------------------------------------------------------------------------------------------- |
| `invalid-url`      | 400    | Paramètre absent, mal formé, schéma autre que http(s), port exotique, identifiants dans l'URL |
| `invalid-device`   | 400    | `device` absent ou inconnu                                                                    |
| `forbidden-origin` | 403    | En-tête `Origin` hors de `ALLOWED_ORIGINS`                                                    |
| `forbidden-host`   | 403    | L'adresse (ou une redirection) pointe vers un réseau privé ou local                           |
| `no-pages`         | 404    | L'adresse ne mène pas à une page HTML (PDF, image, API)                                       |
| `blocked`          | 502    | Le site refuse le robot (401, 403, 429, 503, page de challenge)                               |
| `unreachable`      | 502    | DNS introuvable, connexion refusée, réponse trop lourde, erreur HTTP                          |
| `timeout`          | 504    | Le site met trop de temps à répondre                                                          |
| `rate-limited`     | 429    | Posé par le Firewall Vercel, pas par le code                                                  |
| `internal`         | 500    | Tout le reste (Chrome qui plante…)                                                            |

## Sécurité

Le service charge des adresses fournies par n'importe qui : c'est une cible de SSRF.

- **Filtre d'adresses** (`capture/lib/url-guard.ts`) : seules les adresses IP de plage `unicast` publique sont acceptées (refus de `127.0.0.0/8`, `10/8`, `172.16/12`, `192.168/16`, `169.254/16`, `100.64/10`, `::1`, `fc00::/7`, IPv4 mappées, NAT64, 6to4…). Les noms `localhost`, `*.localhost`, `*.local`, `*.internal` sont refusés sans résolution.
- **Requêtes `fetch`** (`capture/lib/http.ts`) : le contrôle se fait **au moment de la connexion**, dans le `lookup` de l'agent undici. Une résolution DNS qui change entre la vérification et la connexion (DNS rebinding) est donc couverte. Les redirections sont suivies à la main (5 au plus) et revalidées.
- **Chrome** : chaque requête de la page (document, sous-ressources, `fetch` du JS de la page) est interceptée et vérifiée. Risque résiduel : Chrome résout lui-même le DNS après notre vérification ; un rebinding très court reste théoriquement possible. Les WebSockets ne passent pas par l'interception.
- **Limites** : 5 Mo par réponse `fetch`, 8 s par requête, 45 s par capture, 2 048 caractères par URL.
- **Origines** : `ALLOWED_ORIGINS` restreint les origines navigateur. Ce n'est pas une authentification (un script peut forger l'en-tête) : la protection contre l'abus vient du rate limiting Vercel.
- Le service ne renvoie jamais le HTML des pages, seulement des listes de liens et des images.

## Développement local

`@sparticuz/chromium` est un binaire Linux : sous Windows et macOS, le service utilise le Chrome installé.

```bash
cp capture/.env.example capture/.env.local   # renseigner CHROME_PATH
pnpm capture:dev                             # vercel dev sur http://localhost:3001
pnpm capture:test
pnpm capture:typecheck
```

| Variable                       | Où               | Rôle                                                                                                                                                                          |
| ------------------------------ | ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `CHROME_PATH`                  | local uniquement | Chemin du Chrome installé, ex. `C:\Program Files\Google\Chrome\Application\chrome.exe`                                                                                        |
| `ALLOWED_ORIGINS`              | service          | Origines autorisées, séparées par des virgules. `*` accepté dans le sous-domaine (`https://cover-studio-*.vercel.app`). Vide : toutes les origines (développement seulement). |
| `NEXT_PUBLIC_CAPTURE_ENDPOINT` | app              | URL du service, sans slash final. Absente : la fonctionnalité est masquée.                                                                                                    |

## Déploiement sur Vercel

1. **Nouveau projet** importé depuis le même dépôt : Root Directory `capture`, Framework Preset _Other_, Node.js 22.x.
2. **Builds inutiles évités** :
   - projet capture : option « Skip deployments when there are no changes to the root directory » ;
   - projet app : Ignored Build Step `git diff --quiet ${VERCEL_GIT_PREVIOUS_SHA:-HEAD^} HEAD -- . ":!capture"` (comparaison avec le dernier déploiement réussi, pas seulement le dernier commit).
3. **Domaine** : par exemple `capture.<domaine>`. Tant que le service n'est pas sur la branche de production, le domaine peut être rattaché à la branche de développement (option « Git Branch » du domaine), puis détaché à la release.
4. **Variables** : `ALLOWED_ORIGINS` sur le service ; `NEXT_PUBLIC_CAPTURE_ENDPOINT` sur l'app.
5. **Firewall → règles de rate limiting** par IP : `/api/discover` 10 requêtes/min, `/api/capture` 20 requêtes/min, réponse 429.
6. **Spend Management** (plan Pro) : alerte et plafond de dépense. Sur Hobby, le projet est mis en pause une fois les quotas atteints.

`capture/vercel.json` fixe la région (Paris, `cdg1`) et la durée maximale des fonctions (60 s). La mémoire n'y figure pas : elle est ignorée avec la facturation Active CPU et se règle dans les paramètres du projet. Pas d'`includeFiles` non plus : avec pnpm, le chemin du binaire Chromium est un lien symbolique qui rend le paquet de fonction invalide ; le traçage automatique des fichiers suffit.

## Limites connues

- Pages derrière connexion : inaccessibles.
- Sites protégés contre les robots (challenge Cloudflare, captcha) : erreur `blocked`.
- Premier appel après inactivité : 3 à 6 s de plus (démarrage de Chromium).
