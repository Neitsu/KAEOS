# KÆOS Universe — Interactive Showcase (PixiJS + Vite)

Site vitrine interactif **100% statique** pour KÆOS / KAEOS, style game-like (hub map, progression, collectibles, codex).

## Stack

- Vite (SPA statique)
- JavaScript (ES modules)
- PixiJS (World Map WebGL)
- UI overlay HTML/CSS (panels, filtres, settings)
- Fallback map HTML/SVG automatique si PixiJS indisponible (le site reste utilisable)

## Lancer le projet

```bash
npm install
npm run dev
```

Build production:

```bash
npm run build
npm run preview
```

## Déploiement GitHub Pages / Netlify

Le site ne nécessite aucun serveur backend.

### GitHub Pages

1. Dans `vite.config.js`, définir `base: '/<repo-name>/'` si nécessaire.
2. `npm run build`
3. Publier le dossier `dist/`.

### Netlify

- Build command: `npm run build`
- Publish directory: `dist`

## Architecture

```txt
src/
  core/
    app.js            # Orchestration SPA + routing scènes + persistence
    constants.js      # Scènes et defaults
    data.js           # Chargement JSON univers
    save.js           # localStorage + import/export
  scenes/
    worldMap.js       # PixiJS map, pan/zoom, nodes, routes
  styles/
    main.css          # UI premium + glitch discret + responsive

data/
  kaeos-universe.json # Source de vérité pour contenus

assets/
  README.md           # Instructions de remplacement assets
```

## Scènes implémentées

1. **Boot / Press Start**
2. **World Map** (pan/drag, zoom wheel + pinch, nodes verrouillés/débloqués/cleared)
3. **Character Select** (5 membres, stats, skills)
4. **Quest Log** (liste + recherche + focus node)
5. **Codex + Patch Notes**
6. **Settings / Save Slot** (reset/export/import, reduced motion, auto unlock by date, secret code)

## Données JSON-driven

Tout le contenu éditorial est dans:

- `data/kaeos-universe.json`

### Ajouter un membre

Dans `members[]`, ajouter un objet:

- `id`, `name`, `role`, `color`
- `sprite`, `icon`
- `item` (id de collectible)
- `stats.hp/atk/spd/cha/sync`
- `skills[]`
- `links.instagram/youtube`

### Ajouter un level / node

Dans `levels[]`, ajouter:

- `id`, `title`, `type` (`MAIN|SIDE|BOSS|SECRET`)
- `date`, `era`, `color`
- `position.x` / `position.y` (coordonnées map)
- `requires[]` (IDs prérequis)
- `description`
- `links.youtube/spotify/instagram`
- `unlock.mode` (`manual|code`) + `unlock.code`
- `rewards[]` (ids collectibles)

### Ajouter un collectible

Dans `collectibles[]`:

- `id`, `name`, `type`, `icon`

Puis référencer cet `id` dans `levels[].rewards` ou `members[].item`.

### Ajouter un secret code

1. Ajouter l’entrée dans `secrets[]`:
   - `code`
   - `unlocks[]` (ids levels)
   - `hint`
2. Le joueur peut entrer le code dans la scène **Settings**.
3. L’état est sauvegardé dans `save.secretFlags`.

## Save system (localStorage)

Slot unique `Save Slot_01` avec:

- `unlockedNodes[]`
- `clearedNodes[]`
- `collectedItems[]`
- `settings`: `reducedMotion`, `musicMuted`, `uiScale`, `autoUnlockByDate`, `scanlines`
- `secretFlags[]`

Support:

- **Reset Save**
- **Export Save** (JSON)
- **Import Save** (JSON)

## Accessibilité & UX

- Reduced Motion toggle
- Focus visuel clair
- UI responsive desktop/mobile
- Contrôles map souris + tactile

## Notes assets

Le projet fonctionne sans textures finales (fallback canvas/UI).
Remplacer les placeholders dans `assets/` par les ressources premium finales pour production.


## Direction visuelle pixel art

- UI retravaillée en style pixel-art (cadres 8-bit, scanlines, palette fantasy).
- Le site reste utilisable même si Pixi/WebGL échoue grâce au fallback map SVG interactif.
- Les scènes principales (Boot, Map, Quest Log, Characters, Codex, Settings) sont navigables sans écran noir.
- World Map retravaillée en île pixel-art (biomes, routes, landmarks, nuages) avec nodes interactifs.
