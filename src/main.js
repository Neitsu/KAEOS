import { createApp } from './core/app.js';

bootstrap();

async function bootstrap() {
  try {
    await createApp();
  } catch (error) {
    renderFatalError(error);
  }
}

function renderFatalError(error) {
  const root = document.querySelector('#app');
  root.innerHTML = `
    <section class="fatal-error">
      <h1>KÆOS — Boot Failed</h1>
      <p>Une erreur a empêché le chargement de l'application. Vérifie que les assets et le JSON sont accessibles.</p>
      <pre>${escapeHtml(error?.message || String(error))}</pre>
    </section>
  `;
  // eslint-disable-next-line no-console
  console.error(error);
}

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
