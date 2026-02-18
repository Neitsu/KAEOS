function statusColor(status) {
  if (status === 'cleared') return '#8dff5c';
  if (status === 'unlocked') return '#20d4ff';
  return '#59607a';
}

export async function createFallbackMapScene(host, universe, store, callbacks) {
  host.innerHTML = '';
  const wrap = document.createElement('div');
  wrap.className = 'fallback-map';
  wrap.innerHTML = `
    <div class="fallback-map__hint">Mode compatibilité actif (Pixi indisponible) — interactions maintenues.</div>
    <svg class="fallback-map__svg" viewBox="-200 -300 2100 900" xmlns="http://www.w3.org/2000/svg"></svg>
  `;
  host.appendChild(wrap);

  const svg = wrap.querySelector('svg');
  const levels = universe.levels.filter((lvl) => callbacks.getLevelStatus(lvl.id) !== 'hidden');
  const levelById = new Map(levels.map((lvl) => [lvl.id, lvl]));

  levels.forEach((level) => {
    level.requires.forEach((req) => {
      const parent = levelById.get(req);
      if (!parent) return;
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', String(parent.position.x));
      line.setAttribute('y1', String(parent.position.y));
      line.setAttribute('x2', String(level.position.x));
      line.setAttribute('y2', String(level.position.y));
      line.setAttribute('stroke', '#374060');
      line.setAttribute('stroke-width', '3');
      svg.appendChild(line);
    });
  });

  levels.forEach((level) => {
    const status = callbacks.getLevelStatus(level.id);
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    group.setAttribute('transform', `translate(${level.position.x}, ${level.position.y})`);
    group.style.cursor = 'pointer';

    const pulse = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    pulse.setAttribute('r', '26');
    pulse.setAttribute('fill', level.color);
    pulse.setAttribute('fill-opacity', status === 'locked' ? '0.04' : '0.14');
    group.appendChild(pulse);

    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('r', level.type === 'BOSS' ? '18' : '14');
    circle.setAttribute('fill', '#0e1424');
    circle.setAttribute('stroke', statusColor(status));
    circle.setAttribute('stroke-width', '3');
    group.appendChild(circle);

    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.textContent = level.title;
    text.setAttribute('y', '34');
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('fill', '#f4f7ff');
    text.setAttribute('font-size', '14');
    text.setAttribute('font-family', 'Inter, sans-serif');
    group.appendChild(text);

    group.addEventListener('mouseenter', () => callbacks.onNodeHovered(level));
    group.addEventListener('mouseleave', () => callbacks.onNodeHovered(null));
    group.addEventListener('click', () => callbacks.onNodeSelected(level));
    svg.appendChild(group);
  });

  function centerHome() {
    wrap.scrollTo({ left: 0, top: 0, behavior: 'smooth' });
  }

  function focusNode(nodeId) {
    const lvl = levelById.get(nodeId);
    if (!lvl) return;
    callbacks.onNodeSelected(lvl);
  }

  return {
    destroy() {
      host.innerHTML = '';
    },
    centerHome,
    focusNode
  };
}
