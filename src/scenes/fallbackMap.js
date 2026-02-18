function statusColor(status) {
  if (status === 'cleared') return '#6df56d';
  if (status === 'unlocked') return '#ffe87d';
  return '#829f91';
}

function typeIcon(type) {
  if (type === 'BOSS') return '★';
  if (type === 'SECRET') return '?';
  if (type === 'SIDE') return '◆';
  return '●';
}

function createSvg(tag) {
  return document.createElementNS('http://www.w3.org/2000/svg', tag);
}

function drawEnvironment(svg) {
  const water = createSvg('rect');
  water.setAttribute('x', '-800');
  water.setAttribute('y', '-700');
  water.setAttribute('width', '3600');
  water.setAttribute('height', '2400');
  water.setAttribute('fill', '#55a7ff');
  svg.appendChild(water);

  const coastGlow = createSvg('ellipse');
  coastGlow.setAttribute('cx', '900');
  coastGlow.setAttribute('cy', '520');
  coastGlow.setAttribute('rx', '850');
  coastGlow.setAttribute('ry', '490');
  coastGlow.setAttribute('fill', '#8ad5ff');
  coastGlow.setAttribute('fill-opacity', '0.45');
  svg.appendChild(coastGlow);

  const islandShadow = createSvg('path');
  islandShadow.setAttribute('d', 'M220,260 L430,170 L780,120 L1120,130 L1450,220 L1640,360 L1710,580 L1660,770 L1490,880 L1180,950 L800,930 L520,900 L300,810 L170,630 L160,440 Z');
  islandShadow.setAttribute('fill', '#265f35');
  svg.appendChild(islandShadow);

  const island = createSvg('path');
  island.setAttribute('d', 'M210,250 L430,165 L780,108 L1145,126 L1480,214 L1660,352 L1730,578 L1680,785 L1490,906 L1170,976 L780,952 L490,918 L270,820 L130,645 L130,430 Z');
  island.setAttribute('fill', '#79d04e');
  island.setAttribute('stroke', '#f8e6a2');
  island.setAttribute('stroke-width', '18');
  island.setAttribute('paint-order', 'stroke');
  svg.appendChild(island);

  const beach = createSvg('path');
  beach.setAttribute('d', 'M225,265 L430,185 L780,132 L1128,144 L1450,238 L1618,366 L1670,576 L1630,758 L1458,869 L1168,936 L796,914 L525,884 L320,802 L195,641 L190,454 Z');
  beach.setAttribute('fill', '#efdc92');
  beach.setAttribute('opacity', '0.8');
  svg.appendChild(beach);

  const grass = createSvg('path');
  grass.setAttribute('d', 'M255,285 L440,207 L780,154 L1105,168 L1410,250 L1572,380 L1618,574 L1578,736 L1437,842 L1150,900 L806,885 L544,858 L348,786 L245,631 L240,483 Z');
  grass.setAttribute('fill', '#64be4a');
  svg.appendChild(grass);

  addBiome(svg, 'M1010,180 L1280,195 L1460,270 L1522,445 L1458,560 L1330,610 L1170,550 L1048,420 Z', '#d8edf8', 0.85);
  addBiome(svg, 'M1185,620 L1450,642 L1540,742 L1460,850 L1220,875 L1050,824 L1040,700 Z', '#e8d49a', 0.92);
  addBiome(svg, 'M510,322 L760,295 L930,360 L968,520 L770,622 L532,572 L430,455 Z', '#4ea04d', 0.55);

  addLake(svg, 760, 430, 180, 130);
  addLake(svg, 1270, 690, 120, 78);

  drawRoadNetwork(svg);
  drawDecor(svg);
  drawClouds(svg);
}

function addBiome(svg, d, color, opacity) {
  const biome = createSvg('path');
  biome.setAttribute('d', d);
  biome.setAttribute('fill', color);
  biome.setAttribute('fill-opacity', String(opacity));
  svg.appendChild(biome);
}

function addLake(svg, x, y, rx, ry) {
  const lake = createSvg('ellipse');
  lake.setAttribute('cx', String(x));
  lake.setAttribute('cy', String(y));
  lake.setAttribute('rx', String(rx));
  lake.setAttribute('ry', String(ry));
  lake.setAttribute('fill', '#3e87ea');
  lake.setAttribute('stroke', '#9eddff');
  lake.setAttribute('stroke-width', '6');
  svg.appendChild(lake);
}

function drawRoadNetwork(svg) {
  const roads = [
    'M350 700 L520 620 L700 590 L890 620 L1040 710 L1200 705 L1370 600',
    'M560 620 L620 505 L740 430 L860 390 L980 410 L1080 505 L1180 590',
    'M1080 505 L1210 430 L1340 355 L1460 330',
    'M740 430 L630 340 L520 280 L430 245',
    'M1200 705 L1290 780 L1400 820',
    'M900 620 L900 760 L960 840',
    'M520 620 L420 760 L370 820'
  ];

  roads.forEach((d) => {
    const roadBase = createSvg('path');
    roadBase.setAttribute('d', d);
    roadBase.setAttribute('fill', 'none');
    roadBase.setAttribute('stroke', '#9b6b41');
    roadBase.setAttribute('stroke-width', '16');
    roadBase.setAttribute('stroke-linecap', 'round');
    roadBase.setAttribute('stroke-linejoin', 'round');
    svg.appendChild(roadBase);

    const roadTop = createSvg('path');
    roadTop.setAttribute('d', d);
    roadTop.setAttribute('fill', 'none');
    roadTop.setAttribute('stroke', '#f0c77b');
    roadTop.setAttribute('stroke-width', '9');
    roadTop.setAttribute('stroke-linecap', 'round');
    roadTop.setAttribute('stroke-linejoin', 'round');
    svg.appendChild(roadTop);
  });
}

function drawDecor(svg) {
  for (let i = 0; i < 70; i += 1) {
    const x = 280 + (i * 37) % 1360;
    const y = 250 + (i * 53) % 620;
    const tree = createSvg('circle');
    tree.setAttribute('cx', String(x));
    tree.setAttribute('cy', String(y));
    tree.setAttribute('r', '8');
    tree.setAttribute('fill', i % 3 === 0 ? '#2d7f44' : '#358f4d');
    tree.setAttribute('opacity', '0.85');
    svg.appendChild(tree);
  }

  const landmarks = [
    [430, 245, '#ca69ff'],
    [1485, 332, '#6ad9ff'],
    [1405, 820, '#ffb45f'],
    [360, 812, '#ff7cad'],
    [1210, 430, '#ffe87d']
  ];

  landmarks.forEach(([x, y, color]) => {
    const base = createSvg('rect');
    base.setAttribute('x', String(Number(x) - 18));
    base.setAttribute('y', String(Number(y) - 14));
    base.setAttribute('width', '36');
    base.setAttribute('height', '28');
    base.setAttribute('fill', '#354c66');
    base.setAttribute('stroke', color);
    base.setAttribute('stroke-width', '3');
    svg.appendChild(base);

    const roof = createSvg('polygon');
    roof.setAttribute('points', `${Number(x) - 21},${Number(y) - 14} ${x},${Number(y) - 30} ${Number(x) + 21},${Number(y) - 14}`);
    roof.setAttribute('fill', color);
    svg.appendChild(roof);
  });
}

function drawClouds(svg) {
  const clouds = [
    [250, 180, 90], [530, 115, 76], [890, 95, 110], [1260, 120, 96], [1580, 180, 84],
    [300, 900, 105], [730, 950, 82], [1130, 980, 96], [1550, 920, 78]
  ];

  clouds.forEach(([x, y, r]) => {
    const g = createSvg('g');
    g.setAttribute('opacity', '0.93');

    const c1 = createSvg('circle');
    c1.setAttribute('cx', String(x));
    c1.setAttribute('cy', String(y));
    c1.setAttribute('r', String(r));
    c1.setAttribute('fill', '#ffffff');
    g.appendChild(c1);

    const c2 = createSvg('circle');
    c2.setAttribute('cx', String(x + r * 0.72));
    c2.setAttribute('cy', String(y + r * 0.1));
    c2.setAttribute('r', String(r * 0.8));
    c2.setAttribute('fill', '#f3f8ff');
    g.appendChild(c2);

    const c3 = createSvg('circle');
    c3.setAttribute('cx', String(x - r * 0.75));
    c3.setAttribute('cy', String(y + r * 0.15));
    c3.setAttribute('r', String(r * 0.66));
    c3.setAttribute('fill', '#f3f8ff');
    g.appendChild(c3);

    svg.appendChild(g);
  });
}

function project(level, index) {
  // placement structuré en "tour d'île" (similaire map RPG classique)
  const ring = [
    [430, 245], [640, 190], [930, 205], [1210, 285], [1465, 355],
    [1410, 545], [1330, 720], [1160, 845], [910, 880], [670, 850],
    [470, 770], [370, 640], [360, 480], [430, 350]
  ];
  const [x, y] = ring[index % ring.length];
  return {
    ...level,
    mapX: x + (index % 2) * 12,
    mapY: y + (index % 3) * 10
  };
}

export async function createFallbackMapScene(host, universe, store, callbacks) {
  host.innerHTML = '';
  const wrap = document.createElement('div');
  wrap.className = 'fallback-map';
  wrap.innerHTML = `
    <div class="fallback-map__hint">World Map pixel-art active — drag/scroll et click sur les nodes.</div>
    <svg class="fallback-map__svg" viewBox="0 0 1800 1100" xmlns="http://www.w3.org/2000/svg"></svg>
  `;
  host.appendChild(wrap);

  const svg = wrap.querySelector('svg');
  drawEnvironment(svg);

  const levels = universe.levels
    .filter((lvl) => callbacks.getLevelStatus(lvl.id) !== 'hidden')
    .map(project);

  const levelById = new Map(levels.map((lvl) => [lvl.id, lvl]));

  levels.forEach((level) => {
    level.requires.forEach((req) => {
      const parent = levelById.get(req);
      if (!parent) return;

      const routeBack = createSvg('line');
      routeBack.setAttribute('x1', String(parent.mapX));
      routeBack.setAttribute('y1', String(parent.mapY));
      routeBack.setAttribute('x2', String(level.mapX));
      routeBack.setAttribute('y2', String(level.mapY));
      routeBack.setAttribute('stroke', '#7a4f2d');
      routeBack.setAttribute('stroke-width', '10');
      routeBack.setAttribute('stroke-linecap', 'round');
      svg.appendChild(routeBack);

      const route = createSvg('line');
      route.setAttribute('x1', String(parent.mapX));
      route.setAttribute('y1', String(parent.mapY));
      route.setAttribute('x2', String(level.mapX));
      route.setAttribute('y2', String(level.mapY));
      route.setAttribute('stroke', '#f0c77b');
      route.setAttribute('stroke-width', '5');
      route.setAttribute('stroke-linecap', 'round');
      svg.appendChild(route);
    });
  });

  levels.forEach((level) => {
    const status = callbacks.getLevelStatus(level.id);
    const group = createSvg('g');
    group.setAttribute('transform', `translate(${level.mapX}, ${level.mapY})`);
    group.style.cursor = 'pointer';

    const halo = createSvg('circle');
    halo.setAttribute('r', '26');
    halo.setAttribute('fill', level.color);
    halo.setAttribute('fill-opacity', status === 'locked' ? '0.08' : '0.2');
    group.appendChild(halo);

    const outer = createSvg('circle');
    outer.setAttribute('r', level.type === 'BOSS' ? '17' : '14');
    outer.setAttribute('fill', '#23392f');
    outer.setAttribute('stroke', statusColor(status));
    outer.setAttribute('stroke-width', '4');
    group.appendChild(outer);

    const icon = createSvg('text');
    icon.textContent = typeIcon(level.type);
    icon.setAttribute('text-anchor', 'middle');
    icon.setAttribute('y', '5');
    icon.setAttribute('font-size', '17');
    icon.setAttribute('fill', '#fff6ce');
    icon.setAttribute('font-family', 'VT323, monospace');
    group.appendChild(icon);

    const title = createSvg('text');
    title.textContent = level.title;
    title.setAttribute('y', '36');
    title.setAttribute('text-anchor', 'middle');
    title.setAttribute('fill', '#102619');
    title.setAttribute('stroke', '#e6f4d8');
    title.setAttribute('stroke-width', '2');
    title.setAttribute('paint-order', 'stroke');
    title.setAttribute('font-size', '18');
    title.setAttribute('font-family', 'VT323, monospace');
    group.appendChild(title);

    group.addEventListener('mouseenter', () => callbacks.onNodeHovered(level));
    group.addEventListener('mouseleave', () => callbacks.onNodeHovered(null));
    group.addEventListener('click', () => callbacks.onNodeSelected(level));
    svg.appendChild(group);
  });

  // basic drag to pan for desktop
  let isDragging = false;
  let startX = 0;
  let startY = 0;
  let startLeft = 0;
  let startTop = 0;

  wrap.addEventListener('pointerdown', (event) => {
    isDragging = true;
    startX = event.clientX;
    startY = event.clientY;
    startLeft = wrap.scrollLeft;
    startTop = wrap.scrollTop;
  });

  window.addEventListener('pointerup', () => {
    isDragging = false;
  });

  window.addEventListener('pointermove', (event) => {
    if (!isDragging) return;
    wrap.scrollLeft = startLeft - (event.clientX - startX);
    wrap.scrollTop = startTop - (event.clientY - startY);
  });

  function centerHome() {
    wrap.scrollTo({ left: 420, top: 220, behavior: 'smooth' });
  }

  function focusNode(nodeId) {
    const lvl = levelById.get(nodeId);
    if (!lvl) return;
    wrap.scrollTo({ left: Math.max(lvl.mapX - 420, 0), top: Math.max(lvl.mapY - 240, 0), behavior: 'smooth' });
    callbacks.onNodeSelected(lvl);
  }

  centerHome();

  return {
    destroy() {
      host.innerHTML = '';
    },
    centerHome,
    focusNode
  };
}
