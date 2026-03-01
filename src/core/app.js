import { loadUniverse } from './data.js';
import { createMapScene } from '../scenes/worldMap.js';
import { createFallbackMapScene } from '../scenes/fallbackMap.js';
import { SCENES } from './constants.js';
import { exportSave, importSave, loadSave, persistSave, resetSave } from './save.js';

export async function createApp() {
  const root = document.querySelector('#app');
  root.removeAttribute('style');
  root.innerHTML = `<div class="shell"><div id="pixi-host" class="pixi-host"></div><div id="ui" class="ui"></div></div>`;

  const pixiHost = document.querySelector('#pixi-host');
  const ui = document.querySelector('#ui');

  const universe = await loadUniverse();
  const store = {
    universe,
    scene: SCENES.BOOT,
    save: loadSave(),
    selectedLevel: null,
    hoveredLevel: null,
    selectedMember: universe.members[0]?.id ?? null,
    mapMode: 'pixi',
    questFilters: {
      type: 'ALL',
      status: 'ALL',
      era: 'ALL',
      query: ''
    }
  };

  let mapController = null;

  function applyAutoUnlock() {
    if (!store.save.settings.autoUnlockByDate) return;
    const now = new Date();
    store.universe.levels.forEach((lvl) => {
      const date = new Date(lvl.date);
      if (date <= now && !store.save.unlockedNodes.includes(lvl.id)) store.save.unlockedNodes.push(lvl.id);
    });
  }

  function getLevel(levelId) {
    return store.universe.levels.find((lvl) => lvl.id === levelId);
  }

  function getLevelStatus(levelId) {
    const level = getLevel(levelId);
    if (!level) return 'locked';

    const isSecretLocked = level.type === 'SECRET' && !store.save.secretFlags.includes(levelId);
    if (isSecretLocked) return 'hidden';
    if (store.save.clearedNodes.includes(levelId)) return 'cleared';
    if (store.save.unlockedNodes.includes(levelId)) return 'unlocked';

    const prereqMet = level.requires.every((req) => store.save.clearedNodes.includes(req));
    return prereqMet ? 'unlocked' : 'locked';
  }

  function unlockFromClears() {
    store.universe.levels.forEach((lvl) => {
      if (store.save.unlockedNodes.includes(lvl.id)) return;
      if (lvl.requires.every((req) => store.save.clearedNodes.includes(req))) {
        store.save.unlockedNodes.push(lvl.id);
      }
    });
  }

  function markCleared(level) {
    if (!store.save.clearedNodes.includes(level.id)) store.save.clearedNodes.push(level.id);
    level.rewards.forEach((rewardId) => {
      if (!store.save.collectedItems.includes(rewardId)) store.save.collectedItems.push(rewardId);
    });
    unlockFromClears();
    persistSave(store.save);
    bootScene();
  }

  function tryUnlockCode(code) {
    const secret = store.universe.secrets.find((s) => s.code.toLowerCase() === code.trim().toLowerCase());
    if (!secret) return false;
    secret.unlocks.forEach((lvlId) => {
      if (!store.save.secretFlags.includes(lvlId)) store.save.secretFlags.push(lvlId);
      if (!store.save.unlockedNodes.includes(lvlId)) store.save.unlockedNodes.push(lvlId);
    });
    persistSave(store.save);
    bootScene();
    return true;
  }

  function getFirstVisibleLevel() {
    return store.universe.levels.find((lvl) => getLevelStatus(lvl.id) !== 'hidden');
  }

  function transitionTo(scene) {
    store.scene = scene;
    if (scene === SCENES.MAP && !store.selectedLevel) {
      store.selectedLevel = getFirstVisibleLevel() ?? null;
    }
    ui.classList.add('transition');
    setTimeout(() => {
      ui.classList.remove('transition');
      bootScene();
    }, store.save.settings.reducedMotion ? 90 : 230);
  }

  function renderShell() {
    const sceneTabs = [
      [SCENES.MAP, 'WORLD MAP'],
      [SCENES.CHARACTERS, 'CHARACTERS'],
      [SCENES.QUEST_LOG, 'QUEST LOG'],
      [SCENES.CODEX, 'CODEX'],
      [SCENES.SETTINGS, 'SETTINGS']
    ];

    return `<header class="topbar">
      <div class="logo">KÆOS <span>KAEOS</span></div>
      <nav class="tabs">${sceneTabs.map(([id, label]) => `<button data-scene="${id}" class="tab ${store.scene === id ? 'active' : ''}">${label}</button>`).join('')}</nav>
    </header>`;
  }

  async function ensureMapScene() {
    if (store.scene !== SCENES.MAP) return;
    if (!store.selectedLevel) store.selectedLevel = getFirstVisibleLevel() ?? null;
    if (mapController) mapController.destroy();

    const callbacks = {
      getLevelStatus,
      onNodeSelected(level) {
        store.selectedLevel = level;
        renderOverlay();
      },
      onNodeHovered(level) {
        store.hoveredLevel = level;
        renderOverlay();
      }
    };

    try {
      mapController = await createMapScene(pixiHost, store.universe, store, callbacks);
      store.mapMode = 'pixi';
    } catch (error) {
      // Fallback: rendu map SVG/HTML pleinement interactif.
      mapController = await createFallbackMapScene(pixiHost, store.universe, store, callbacks);
      store.mapMode = 'fallback';
      if (!store.save.settings.reducedMotion) console.warn('Pixi indisponible, fallback map activée:', error);
    }

    renderOverlay();
  }

  function renderBoot() {
    return `<section class="boot-screen ${store.save.settings.scanlines ? 'scanlines' : ''}">
      <h1>KÆOS</h1>
      <p class="sub">Digital idol squad entering the Nexus...</p>
      <button id="press-start" class="btn btn-primary">PRESS START</button>
      <div class="quick-links">
        <button data-scene="map">World Map</button>
        <button data-scene="characters">Characters</button>
        <button data-scene="quest-log">Quest Log</button>
        <button data-scene="codex">Codex</button>
      </div>
    </section>`;
  }

  function renderMapPanel() {
    const level = store.selectedLevel;
    const hover = store.hoveredLevel;
    const collectibles = new Map(store.universe.collectibles.map((item) => [item.id, item]));
    const hoverMarkup = hover ? `<div class="tooltip">${hover.title} · ${hover.type} · ${hover.date}</div>` : '';
    const levelMarkup = !level ? '<div class="panel muted">Select a node to inspect release details.</div>' : `<div class="panel">
      <h3>${level.title}</h3>
      <p class="meta"><span>${level.type}</span><span>${level.date}</span><span style="color:${level.color}">${level.era}</span><span>${getLevelStatus(level.id).toUpperCase()}</span></p>
      <p>${level.description}</p>
      <div class="links">${Object.entries(level.links).filter(([, v]) => v).map(([k, v]) => `<a href="${v}" target="_blank" rel="noreferrer">${k}</a>`).join('')}</div>
      <p class="meta">Collectibles: ${level.rewards.map((id) => collectibles.get(id)?.name ?? id).join(', ')}</p>
      <div class="actions">
        <button data-action="clear" ${getLevelStatus(level.id) === 'locked' ? 'disabled' : ''}>Mark as Cleared</button>
        <button data-action="home">Home</button>
      </div>
    </div>`;

    const fallbackTag = store.mapMode === 'fallback' ? '<div class="panel panel-note">Map running in compatibility mode.</div>' : '';
    return `<section class="overlay map-overlay">${hoverMarkup}${fallbackTag}${levelMarkup}</section>`;
  }

  function renderCharacters() {
    const active = store.universe.members.find((m) => m.id === store.selectedMember);
    return `<section class="overlay characters">
      <div class="cards">${store.universe.members.map((member) => `<button class="member-card ${active?.id === member.id ? 'active' : ''}" data-member="${member.id}">
        <div class="avatar" style="--c:${member.color}">${member.name.slice(0, 1)}</div>
        <h4>${member.name}</h4><p>${member.role}</p>
      </button>`).join('')}</div>
      ${active ? `<article class="panel detail">
        <h3>${active.name}</h3><p>${active.role}</p><p>Skills: ${active.skills.join(' · ')}</p>
        <p>Item: ${active.item}</p>
        <ul class="stats">${Object.entries(active.stats).map(([k, v]) => `<li><span>${k.toUpperCase()}</span><strong>${v}</strong></li>`).join('')}</ul>
      </article>` : ''}
    </section>`;
  }

  function getFilteredQuestRows() {
    const levels = store.universe.levels.filter((lvl) => getLevelStatus(lvl.id) !== 'hidden');
    return levels.filter((lvl) => {
      const status = getLevelStatus(lvl.id);
      const f = store.questFilters;
      if (f.type !== 'ALL' && lvl.type !== f.type) return false;
      if (f.status !== 'ALL' && status !== f.status) return false;
      if (f.era !== 'ALL' && lvl.era !== f.era) return false;
      if (f.query && !`${lvl.title} ${lvl.description}`.toLowerCase().includes(f.query.toLowerCase())) return false;
      return true;
    });
  }

  function renderQuestLog() {
    const rows = getFilteredQuestRows();
    const eras = [...new Set(store.universe.levels.map((lvl) => lvl.era))];
    return `<section class="overlay quest-log">
      <div class="panel">
        <h3>Quest Log</h3>
        <div class="filters">
          <input id="quest-search" placeholder="Search quest..." value="${store.questFilters.query}" />
          <select data-filter="type">
            ${['ALL', 'MAIN', 'SIDE', 'BOSS', 'SECRET'].map((opt) => `<option value="${opt}" ${store.questFilters.type === opt ? 'selected' : ''}>Type: ${opt}</option>`).join('')}
          </select>
          <select data-filter="status">
            ${['ALL', 'locked', 'unlocked', 'cleared'].map((opt) => `<option value="${opt}" ${store.questFilters.status === opt ? 'selected' : ''}>Status: ${opt}</option>`).join('')}
          </select>
          <select data-filter="era">
            ${['ALL', ...eras].map((opt) => `<option value="${opt}" ${store.questFilters.era === opt ? 'selected' : ''}>Era: ${opt}</option>`).join('')}
          </select>
        </div>
        <div class="quest-list">
          ${rows.map((lvl) => `<button class="quest-item" data-open-level="${lvl.id}"><span>${lvl.title}</span><small>${lvl.type} · ${lvl.era}</small><em>${getLevelStatus(lvl.id)}</em></button>`).join('')}
        </div>
      </div>
    </section>`;
  }

  function renderCodex() {
    return `<section class="overlay codex-grid">
      <div class="panel"><h3>Codex</h3>${store.universe.codex.map((entry) => `<article><h4>${entry.title}</h4><p>${entry.content}</p></article>`).join('')}</div>
      <div class="panel"><h3>Patch Notes</h3>${store.universe.patchNotes.map((note) => `<article><h4>${note.version} <small>${note.date}</small></h4><ul>${note.notes.map((n) => `<li>${n}</li>`).join('')}</ul></article>`).join('')}</div>
    </section>`;
  }

  function renderSettings() {
    const settings = store.save.settings;
    return `<section class="overlay settings">
      <div class="panel">
        <h3>Save Slot_01</h3>
        <label><input type="checkbox" data-setting="reducedMotion" ${settings.reducedMotion ? 'checked' : ''}/> Reduced Motion</label>
        <label><input type="checkbox" data-setting="musicMuted" ${settings.musicMuted ? 'checked' : ''}/> Music Muted</label>
        <label><input type="checkbox" data-setting="autoUnlockByDate" ${settings.autoUnlockByDate ? 'checked' : ''}/> Auto-unlock by date</label>
        <label><input type="checkbox" data-setting="scanlines" ${settings.scanlines ? 'checked' : ''}/> Scanlines</label>
        <label>UI Scale <input type="range" min="0.8" max="1.2" step="0.05" data-setting-range="uiScale" value="${settings.uiScale}"/></label>
        <div class="actions">
          <button data-action="export">Export Save</button>
          <label class="file-input">Import Save<input id="import-save" type="file" accept="application/json"/></label>
          <button data-action="reset">Reset Save</button>
        </div>
        <div class="secret">
          <input id="secret-input" placeholder="Enter secret code" />
          <button data-action="unlock-secret">Unlock Secret Room</button>
        </div>
      </div>
    </section>`;
  }

  function renderOverlay() {
    const sceneMarkup = {
      [SCENES.BOOT]: renderBoot(),
      [SCENES.MAP]: renderMapPanel(),
      [SCENES.CHARACTERS]: renderCharacters(),
      [SCENES.QUEST_LOG]: renderQuestLog(),
      [SCENES.CODEX]: renderCodex(),
      [SCENES.SETTINGS]: renderSettings()
    };

    ui.innerHTML = `${store.scene === SCENES.BOOT ? '' : renderShell()}${sceneMarkup[store.scene]}`;
    bindOverlay();
  }

  function bindOverlay() {
    ui.querySelectorAll('[data-scene]').forEach((button) => {
      button.addEventListener('click', () => transitionTo(button.dataset.scene));
    });

    const pressStart = ui.querySelector('#press-start');
    if (pressStart) pressStart.addEventListener('click', () => transitionTo(SCENES.MAP));

    ui.querySelectorAll('[data-member]').forEach((button) => {
      button.addEventListener('click', () => {
        store.selectedMember = button.dataset.member;
        renderOverlay();
      });
    });

    ui.querySelectorAll('[data-open-level]').forEach((button) => {
      button.addEventListener('click', () => {
        const level = getLevel(button.dataset.openLevel);
        if (!level) return;
        store.selectedLevel = level;
        transitionTo(SCENES.MAP);
        setTimeout(() => mapController?.focusNode(level.id), 260);
      });
    });

    const search = ui.querySelector('#quest-search');
    if (search) {
      search.addEventListener('input', () => {
        store.questFilters.query = search.value;
        renderOverlay();
      });
    }

    ui.querySelectorAll('[data-filter]').forEach((select) => {
      select.addEventListener('change', () => {
        store.questFilters[select.dataset.filter] = select.value;
        renderOverlay();
      });
    });

    ui.querySelectorAll('[data-action]').forEach((button) => {
      button.addEventListener('click', async () => {
        const action = button.dataset.action;
        if (action === 'clear' && store.selectedLevel) markCleared(store.selectedLevel);
        if (action === 'home') mapController?.centerHome();
        if (action === 'export') exportSave(store.save);
        if (action === 'reset') {
          store.save = resetSave();
          persistSave(store.save);
          bootScene();
        }
        if (action === 'unlock-secret') {
          const input = ui.querySelector('#secret-input');
          const ok = tryUnlockCode(input?.value || '');
          if (input) input.value = ok ? 'UNLOCKED' : 'INVALID CODE';
        }
      });
    });

    ui.querySelectorAll('[data-setting]').forEach((input) => {
      input.addEventListener('change', () => {
        store.save.settings[input.dataset.setting] = input.checked;
        persistSave(store.save);
        bootScene();
      });
    });

    ui.querySelectorAll('[data-setting-range]').forEach((input) => {
      input.addEventListener('input', () => {
        store.save.settings[input.dataset.settingRange] = Number(input.value);
        document.documentElement.style.setProperty('--ui-scale', `${input.value}`);
        persistSave(store.save);
      });
    });

    const importField = ui.querySelector('#import-save');
    if (importField) {
      importField.addEventListener('change', async () => {
        const [file] = importField.files || [];
        if (!file) return;
        store.save = await importSave(file);
        persistSave(store.save);
        bootScene();
      });
    }
  }

  async function bootScene() {
    applyAutoUnlock();
    unlockFromClears();
    persistSave(store.save);

    if (store.scene !== SCENES.MAP && mapController) {
      mapController.destroy();
      mapController = null;
      pixiHost.innerHTML = '';
    }

    renderOverlay();
    await ensureMapScene();
  }

  document.documentElement.style.setProperty('--ui-scale', `${store.save.settings.uiScale}`);
  await bootScene();
}
