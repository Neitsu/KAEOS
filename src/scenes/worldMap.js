const typeColors = {
  MAIN: 0xffd66b,
  SIDE: 0x7de9ff,
  BOSS: 0xff6e7f,
  SECRET: 0xc88eff
};

let pixiCache = null;

async function getPixi() {
  if (pixiCache) return pixiCache;
  try {
    pixiCache = await import('pixi.js');
  } catch {
    pixiCache = await import('https://cdn.jsdelivr.net/npm/pixi.js@8.6.5/dist/pixi.mjs');
  }
  return pixiCache;
}

function mapPosition(level, index) {
  const ring = [
    [430, 245], [640, 190], [930, 205], [1210, 285], [1465, 355],
    [1410, 545], [1330, 720], [1160, 845], [910, 880], [670, 850],
    [470, 770], [370, 640], [360, 480], [430, 350]
  ];
  const [x, y] = ring[index % ring.length];
  return { ...level, mapX: x + (index % 2) * 12, mapY: y + (index % 3) * 10 };
}

export async function createMapScene(host, universe, store, callbacks) {
  const { Application, Container, Graphics, Text } = await getPixi();

  const app = new Application();
  await app.init({ resizeTo: host, antialias: false, backgroundColor: 0x62b8ea });
  host.innerHTML = '';
  host.appendChild(app.canvas);

  const viewport = new Container();
  const decorLayer = new Container();
  const routeLayer = new Container();
  const nodeLayer = new Container();
  viewport.addChild(decorLayer, routeLayer, nodeLayer);
  app.stage.addChild(viewport);

  drawIslandBackground(Graphics, decorLayer);

  const levels = universe.levels
    .filter((lvl) => callbacks.getLevelStatus(lvl.id) !== 'hidden')
    .map(mapPosition);

  const byId = new Map(levels.map((lvl) => [lvl.id, lvl]));

  levels.forEach((level) => {
    level.requires.forEach((req) => {
      const parent = byId.get(req);
      if (!parent) return;

      const roadBack = new Graphics();
      roadBack.moveTo(parent.mapX, parent.mapY).lineTo(level.mapX, level.mapY).stroke({ color: 0x7a4f2d, width: 10, alpha: 0.9 });
      routeLayer.addChild(roadBack);

      const road = new Graphics();
      road.moveTo(parent.mapX, parent.mapY).lineTo(level.mapX, level.mapY).stroke({ color: 0xf0c77b, width: 5, alpha: 0.95 });
      routeLayer.addChild(road);
    });
  });

  const nodeRefs = new Map();
  levels.forEach((level) => {
    const status = callbacks.getLevelStatus(level.id);
    const node = createNode({ Container, Graphics, Text }, level, status, store.save.settings.reducedMotion);
    node.position.set(level.mapX, level.mapY);
    node.eventMode = 'static';
    node.cursor = 'pointer';

    node.on('pointertap', () => callbacks.onNodeSelected(level));
    node.on('pointerover', () => callbacks.onNodeHovered(level));
    node.on('pointerout', () => callbacks.onNodeHovered(null));

    nodeLayer.addChild(node);
    nodeRefs.set(level.id, node);
  });

  const bounds = { minScale: 0.55, maxScale: 2 };
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

  centerHome();

  function centerHome() {
    viewport.position.set(app.screen.width * 0.05, app.screen.height * 0.05);
  }

  function focusNode(nodeId) {
    const node = nodeRefs.get(nodeId);
    if (!node) return;
    viewport.x = app.screen.width / 2 - node.x * viewport.scale.x;
    viewport.y = app.screen.height / 2 - node.y * viewport.scale.y;
  }

  function destroy() {
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

  const halo = new Graphics();
  halo.circle(0, 0, 24).fill({ color, alpha: status === 'locked' ? 0.08 : 0.2 });
  container.addChild(halo);

  const ring = new Graphics();
  const radius = level.type === 'BOSS' ? 16 : 13;
  ring.circle(0, 0, radius).fill({ color: 0x213b2f, alpha: 0.96 });
  ring.circle(0, 0, radius).stroke({ color: status === 'locked' ? 0x7b968a : color, width: 3, alpha: 1 });
  container.addChild(ring);

  if (status === 'cleared') {
    const check = new Graphics();
    check.moveTo(-5, 1).lineTo(-1, 5).lineTo(6, -4).stroke({ color: 0x93ff96, width: 2 });
    container.addChild(check);
  }

  const icon = new Text({
    text: level.type === 'BOSS' ? '★' : level.type === 'SECRET' ? '?' : '•',
    style: {
      fontFamily: 'VT323, monospace',
      fontSize: 17,
      fill: '#fff6ce'
    }
  });
  icon.x = -icon.width / 2;
  icon.y = -10;
  container.addChild(icon);

  const title = new Text({
    text: level.title,
    style: {
      fontFamily: 'VT323, monospace',
      fontSize: 20,
      fill: '#102619',
      stroke: { color: '#e6f4d8', width: 2 }
    }
  });
  title.y = 24;
  title.x = -title.width / 2;
  container.addChild(title);

  if (!reducedMotion) {
    container.alpha = 0.96;
  }

  return container;
}

function drawIslandBackground(Graphics, target) {
  const sky = new Graphics();
  sky.rect(-1000, -700, 3800, 2100).fill({ color: 0x67c2ff, alpha: 1 });
  target.addChild(sky);

  const glow = new Graphics();
  glow.ellipse(900, 520, 850, 480).fill({ color: 0x8ad5ff, alpha: 0.45 });
  target.addChild(glow);

  const island = new Graphics();
  island.poly([
    210, 250, 430, 165, 780, 108, 1145, 126, 1480, 214, 1660, 352, 1730, 578,
    1680, 785, 1490, 906, 1170, 976, 780, 952, 490, 918, 270, 820, 130, 645, 130, 430
  ]).fill({ color: 0x79d04e, alpha: 1 }).stroke({ color: 0xf8e6a2, width: 16, alpha: 0.9 });
  target.addChild(island);

  const grass = new Graphics();
  grass.poly([
    255, 285, 440, 207, 780, 154, 1105, 168, 1410, 250, 1572, 380, 1618, 574,
    1578, 736, 1437, 842, 1150, 900, 806, 885, 544, 858, 348, 786, 245, 631, 240, 483
  ]).fill({ color: 0x64be4a, alpha: 0.95 });
  target.addChild(grass);

  const lake = new Graphics();
  lake.ellipse(760, 430, 180, 130).fill({ color: 0x3e87ea, alpha: 0.95 }).stroke({ color: 0x9eddff, width: 6, alpha: 0.9 });
  lake.ellipse(1270, 690, 120, 78).fill({ color: 0x3e87ea, alpha: 0.9 }).stroke({ color: 0x9eddff, width: 6, alpha: 0.9 });
  target.addChild(lake);

  for (let i = 0; i < 80; i += 1) {
    const tree = new Graphics();
    const x = 280 + (i * 37) % 1360;
    const y = 250 + (i * 53) % 620;
    tree.circle(x, y, 7).fill({ color: i % 3 === 0 ? 0x2d7f44 : 0x358f4d, alpha: 0.85 });
    target.addChild(tree);
  }
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
