const typeColors = {
  MAIN: 0x20d4ff,
  SIDE: 0x9d7dff,
  BOSS: 0xff496c,
  SECRET: 0x8dff5c
};

let pixiCache = null;

async function getPixi() {
  if (pixiCache) return pixiCache;
  try {
    pixiCache = await import('pixi.js');
  } catch {
    // Fallback utile si l'environnement ne peut pas installer node_modules.
    pixiCache = await import('https://cdn.jsdelivr.net/npm/pixi.js@8.6.5/dist/pixi.mjs');
  }
  return pixiCache;
}

export async function createMapScene(host, universe, store, callbacks) {
  const { Application, Container, Graphics, Text } = await getPixi();

  const app = new Application();
  await app.init({ resizeTo: host, antialias: true, backgroundColor: 0x080a10 });
  host.innerHTML = '';
  host.appendChild(app.canvas);

  const viewport = new Container();
  const parallaxBack = new Container();
  const mapLayer = new Container();
  const particles = new Container();
  viewport.addChild(parallaxBack, particles, mapLayer);
  app.stage.addChild(viewport);

  drawParallax(Graphics, parallaxBack);
  spawnParticles(Graphics, particles, store.save.settings.reducedMotion);
  drawRoutes(Graphics, mapLayer, universe.levels);

  const nodeRefs = new Map();
  universe.levels.forEach((level) => {
    const status = callbacks.getLevelStatus(level.id);
    if (status === 'hidden') return;
    const node = createNode({ Container, Graphics, Text }, level, status, store.save.settings.reducedMotion);
    node.position.set(level.position.x, level.position.y);
    node.eventMode = 'static';
    node.cursor = 'pointer';

    node.on('pointertap', () => callbacks.onNodeSelected(level));
    node.on('pointerover', () => callbacks.onNodeHovered(level, status));
    node.on('pointerout', () => callbacks.onNodeHovered(null));

    mapLayer.addChild(node);
    nodeRefs.set(level.id, node);
  });

  const bounds = { minScale: 0.45, maxScale: 2.2 };
  let dragging = false;
  let last = { x: 0, y: 0 };

  const onPointerDown = (event) => {
    dragging = true;
    last = { x: event.clientX, y: event.clientY };
  };

  const onPointerUp = () => {
    dragging = false;
  };

  const onPointerMove = (event) => {
    if (!dragging) return;
    const dx = event.clientX - last.x;
    const dy = event.clientY - last.y;
    viewport.x += dx;
    viewport.y += dy;
    parallaxBack.x = viewport.x * 0.4;
    parallaxBack.y = viewport.y * 0.4;
    last = { x: event.clientX, y: event.clientY };
  };

  const onWheel = (event) => {
    event.preventDefault();
    const direction = event.deltaY > 0 ? -1 : 1;
    const nextScale = clamp(viewport.scale.x + direction * 0.08, bounds.minScale, bounds.maxScale);
    viewport.scale.set(nextScale);
  };

  app.canvas.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('pointerup', onPointerUp);
  window.addEventListener('pointermove', onPointerMove);
  app.canvas.addEventListener('wheel', onWheel, { passive: false });

  // Simple pinch support.
  let pinchDist = null;
  const onTouchMove = (event) => {
    if (event.touches.length !== 2) return;
    event.preventDefault();
    const [a, b] = event.touches;
    const dist = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
    if (pinchDist) {
      const delta = (dist - pinchDist) * 0.003;
      const nextScale = clamp(viewport.scale.x + delta, bounds.minScale, bounds.maxScale);
      viewport.scale.set(nextScale);
    }
    pinchDist = dist;
  };

  const onTouchEnd = () => {
    pinchDist = null;
  };

  app.canvas.addEventListener('touchmove', onTouchMove, { passive: false });
  app.canvas.addEventListener('touchend', onTouchEnd);

  const tick = () => {
    if (!store.save.settings.reducedMotion) {
      particles.children.forEach((dot) => {
        dot.y -= 0.15;
        if (dot.y < -900) dot.y = 900;
      });
    }
  };

  app.ticker.add(tick);
  centerHome();

  function centerHome() {
    viewport.position.set(app.screen.width * 0.18, app.screen.height * 0.52);
  }

  function focusNode(nodeId) {
    const node = nodeRefs.get(nodeId);
    if (!node) return;
    viewport.x = app.screen.width / 2 - node.x * viewport.scale.x;
    viewport.y = app.screen.height / 2 - node.y * viewport.scale.y;
  }

  function destroy() {
    app.ticker.remove(tick);
    app.canvas.removeEventListener('pointerdown', onPointerDown);
    window.removeEventListener('pointerup', onPointerUp);
    window.removeEventListener('pointermove', onPointerMove);
    app.canvas.removeEventListener('wheel', onWheel);
    app.canvas.removeEventListener('touchmove', onTouchMove);
    app.canvas.removeEventListener('touchend', onTouchEnd);
    app.destroy(true, true);
  }

  return { destroy, focusNode, centerHome };
}

function createNode(pixi, level, status, reducedMotion) {
  const { Container, Graphics, Text } = pixi;
  const container = new Container();
  const color = typeColors[level.type] ?? 0xffffff;

  const ring = new Graphics();
  const radius = level.type === 'BOSS' ? 26 : level.type === 'SECRET' ? 14 : 18;
  ring.circle(0, 0, radius).stroke({ color, width: 3, alpha: 0.9 });
  ring.circle(0, 0, radius - 4).fill({ color, alpha: status === 'locked' ? 0.15 : 0.28 });
  container.addChild(ring);

  if (!reducedMotion) {
    const glow = new Graphics();
    glow.circle(0, 0, radius + 10).fill({ color, alpha: 0.08 });
    container.addChild(glow);
  }

  if (status === 'cleared') {
    const marker = new Graphics();
    marker.moveTo(-6, 0).lineTo(-2, 5).lineTo(7, -6).stroke({ color: 0x8dff5c, width: 2 });
    container.addChild(marker);
  }

  const title = new Text({
    text: level.title,
    style: {
      fontFamily: 'Inter',
      fontSize: 12,
      fill: status === 'locked' ? '#838897' : '#f4f7ff'
    }
  });
  title.y = 24;
  title.x = -title.width / 2;
  container.addChild(title);
  return container;
}

function drawRoutes(Graphics, target, levels) {
  const index = new Map(levels.map((lvl) => [lvl.id, lvl]));
  levels.forEach((level) => {
    level.requires.forEach((req) => {
      const parent = index.get(req);
      if (!parent) return;
      const route = new Graphics();
      route.moveTo(parent.position.x, parent.position.y)
        .lineTo(level.position.x, level.position.y)
        .stroke({ color: 0x4d5470, width: 2, alpha: 0.7 });
      target.addChild(route);
    });
  });
}

function drawParallax(Graphics, target) {
  for (let layer = 0; layer < 3; layer += 1) {
    const g = new Graphics();
    g.rect(-2200, -1400, 5000, 3400).fill({ color: layer === 0 ? 0x090b14 : layer === 1 ? 0x10152a : 0x141b31, alpha: 0.5 - layer * 0.08 });
    target.addChild(g);
  }
}

function spawnParticles(Graphics, target, reducedMotion) {
  for (let i = 0; i < 120; i += 1) {
    const dot = new Graphics();
    dot.circle(0, 0, reducedMotion ? 1 : Math.random() * 2 + 0.5).fill({ color: 0x63f5ff, alpha: reducedMotion ? 0.05 : 0.14 });
    dot.x = Math.random() * 2200 - 900;
    dot.y = Math.random() * 1800 - 900;
    target.addChild(dot);
  }
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
