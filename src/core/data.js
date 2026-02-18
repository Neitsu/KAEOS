export async function loadUniverse() {
  const url = `${import.meta.env.BASE_URL}data/kaeos-universe.json`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Impossible de charger kaeos-universe.json (${response.status})`);
  return response.json();
}
