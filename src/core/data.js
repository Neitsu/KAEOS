export async function loadUniverse() {
  const viteBase = typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL
    ? import.meta.env.BASE_URL
    : './';

  const url = new URL(`${viteBase}data/kaeos-universe.json`, document.baseURI).toString();
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Impossible de charger kaeos-universe.json (${response.status})`);
  return response.json();
}
