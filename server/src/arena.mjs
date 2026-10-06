// One reference phone battlefield is 900 x 300 world units, excluding the HUD.
// Physical phones share this world; their aspect ratio never changes spawn positions.
const viewport = { width: 900, height: 300 };
const screens = { columns: 9, rows: 9 };
const width = viewport.width * screens.columns;
const height = viewport.height * screens.rows;
const tileSize = 900;
const blockObstacles = [
  { x: 95, y: 85, width: 220, height: 225 },
  { x: 635, y: 85, width: 165, height: 235 },
  { x: 95, y: 535, width: 175, height: 205 },
  { x: 615, y: 550, width: 180, height: 195 },
  { x: 325, y: 265, width: 32, height: 40 },
  { x: 540, y: 280, width: 42, height: 32 },
  { x: 310, y: 725, width: 34, height: 38 },
  { x: 550, y: 735, width: 34, height: 35 },
];
const obstacles = [], hiddenZones = [];
for (let row = 0; row < height / tileSize; row++) {
  for (let col = 0; col < width / tileSize; col++) {
    const x = col * tileSize, y = row * tileSize;
    obstacles.push(...blockObstacles.map(rect => ({ ...rect, x: x + rect.x, y: y + rect.y })));
    hiddenZones.push(
      { id: `arcade-${col}-${row}`, name: '騎樓', x: x + 85, y: y + 330, width: 265, height: 55 },
      { id: `lane-${col}-${row}`, name: '店後巷', x: x + 280, y: y + 565, width: 65, height: 140 },
    );
  }
}

export const arena = {
  width, height, viewport, screens, tileSize,
  sightRange: 650,
  projectileOrigin: { forward: 41, height: -34, mouthSide: 5, blowLean: 7 },
  spawns: [
    { x: 45, y: 100 }, { x: width - 45, y: 100 },
    { x: 45, y: height - 100 }, { x: width - 45, y: height - 100 },
  ],
  zoneTiming: { start: 30, finalArea: 180, collapse: 230, limit: 240 },
  obstacles, hiddenZones,
};
