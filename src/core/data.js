export async function loadUniverse() {
  const response = await fetch('/data/kaeos-universe.json');
  if (!response.ok) throw new Error('Impossible de charger kaeos-universe.json');
  return response.json();
}
