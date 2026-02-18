import { DEFAULT_SAVE, SAVE_KEY } from './constants.js';

export function loadSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return structuredClone(DEFAULT_SAVE);
    const parsed = JSON.parse(raw);
    return {
      ...structuredClone(DEFAULT_SAVE),
      ...parsed,
      settings: {
        ...DEFAULT_SAVE.settings,
        ...(parsed.settings || {})
      }
    };
  } catch {
    return structuredClone(DEFAULT_SAVE);
  }
}

export function persistSave(save) {
  localStorage.setItem(SAVE_KEY, JSON.stringify(save));
}

export function resetSave() {
  localStorage.removeItem(SAVE_KEY);
  return structuredClone(DEFAULT_SAVE);
}

export function exportSave(save) {
  const blob = new Blob([JSON.stringify(save, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'kaeos-save-slot-01.json';
  a.click();
  URL.revokeObjectURL(url);
}

export function importSave(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const value = JSON.parse(reader.result);
        resolve({
          ...structuredClone(DEFAULT_SAVE),
          ...value,
          settings: {
            ...DEFAULT_SAVE.settings,
            ...(value.settings || {})
          }
        });
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = reject;
    reader.readAsText(file);
  });
}
