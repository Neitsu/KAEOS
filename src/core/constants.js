export const SCENES = {
  BOOT: 'boot',
  MAP: 'map',
  CHARACTERS: 'characters',
  QUEST_LOG: 'quest-log',
  CODEX: 'codex',
  SETTINGS: 'settings'
};

export const NODE_TYPES = {
  MAIN: 'MAIN',
  SIDE: 'SIDE',
  BOSS: 'BOSS',
  SECRET: 'SECRET'
};

export const SAVE_KEY = 'kaeos_save_slot_01';

export const DEFAULT_SAVE = {
  unlockedNodes: ['lvl_boot'],
  clearedNodes: [],
  collectedItems: [],
  settings: {
    reducedMotion: false,
    musicMuted: true,
    uiScale: 1,
    autoUnlockByDate: false,
    scanlines: true
  },
  secretFlags: []
};
