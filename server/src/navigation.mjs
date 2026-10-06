import { arena } from './arena.mjs';

const PLAYER_RADIUS = 15;
const CELL = 25;
const BUCKET = 150;
const cols = Math.ceil(arena.width / CELL), rows = Math.ceil(arena.height / CELL);
const buckets = new Map();
for (const rect of arena.obstacles) {
  for (let y = Math.floor(rect.y / BUCKET); y <= Math.floor((rect.y + rect.height) / BUCKET); y++) {
    for (let x = Math.floor(rect.x / BUCKET); x <= Math.floor((rect.x + rect.width) / BUCKET); x++) {
      const key = `${x},${y}`;
      if (!buckets.has(key)) buckets.set(key, []);
      buckets.get(key).push(rect);
    }
  }
}

export function blocked(x, y, radius) {
  for (let by = Math.floor((y - radius) / BUCKET); by <= Math.floor((y + radius) / BUCKET); by++) {
    for (let bx = Math.floor((x - radius) / BUCKET); bx <= Math.floor((x + radius) / BUCKET); bx++) {
      if (buckets.get(`${bx},${by}`)?.some(r => x + radius > r.x && x - radius < r.x + r.width &&
        y + radius > r.y && y - radius < r.y + r.height)) return true;
    }
  }
  return false;
}

export function clearSight(from, to, radius = 4) {
  const steps = Math.ceil(Math.hypot(to.x - from.x, to.y - from.y) / 8);
  for (let i = 0; i <= steps; i++) {
    const t = steps ? i / steps : 0;
    if (blocked(from.x + (to.x - from.x) * t, from.y + (to.y - from.y) * t, radius)) return false;
  }
  return true;
}

const open = new Uint8Array(cols * rows);
for (let row = 0; row < rows; row++) for (let col = 0; col < cols; col++) {
  const x = (col + .5) * CELL, y = (row + .5) * CELL;
  open[row * cols + col] = x >= PLAYER_RADIUS && x <= arena.width - PLAYER_RADIUS &&
    y >= PLAYER_RADIUS && y <= arena.height - PLAYER_RADIUS && !blocked(x, y, PLAYER_RADIUS) ? 1 : 0;
}
const center = cell => ({ x: (cell % cols + .5) * CELL, y: (Math.floor(cell / cols) + .5) * CELL });
const cellAt = point => Math.max(0, Math.min(rows - 1, Math.floor(point.y / CELL))) * cols +
  Math.max(0, Math.min(cols - 1, Math.floor(point.x / CELL)));
function neighbors(cell) {
  const col = cell % cols, row = Math.floor(cell / cols);
  return [col > 0 ? cell - 1 : -1, col < cols - 1 ? cell + 1 : -1,
    row > 0 ? cell - cols : -1, row < rows - 1 ? cell + cols : -1].filter(n => n >= 0 && open[n]);
}
function nearestOpen(point) {
  const cell = cellAt(point);
  if (open[cell]) return cell;
  // A valid actor can stand near an obstacle even if its coarse cell center is blocked.
  const col = cell % cols, row = Math.floor(cell / cols);
  for (let range = 1; range <= 8; range++) {
    for (let y = Math.max(0, row - range); y <= Math.min(rows - 1, row + range); y++) {
      for (let x = Math.max(0, col - range); x <= Math.min(cols - 1, col + range); x++) {
        const candidate = y * cols + x;
        if (open[candidate] && clearSight(point, center(candidate), PLAYER_RADIUS)) return candidate;
      }
    }
  }
  return -1;
}
// Reuse reverse distance fields. A large map must not rebuild a BFS for every bot tick.
const fields = new Map();
function distanceField(goal) {
  if (fields.has(goal)) return fields.get(goal);
  const distances = new Int32Array(open.length).fill(-1);
  const queue = new Int32Array(open.length);
  let head = 0, tail = 0;
  distances[goal] = 0; queue[tail++] = goal;
  while (head < tail) {
    const cell = queue[head++];
    for (const next of neighbors(cell)) if (distances[next] < 0) {
      distances[next] = distances[cell] + 1; queue[tail++] = next;
    }
  }
  if (fields.size >= 16) fields.delete(fields.keys().next().value);
  fields.set(goal, distances);
  return distances;
}
const direction = (from, to) => {
  const dx = to.x - from.x, dy = to.y - from.y, length = Math.hypot(dx, dy) || 1;
  return { x: dx / length, y: dy / length };
};

export function routeDirection(from, to) {
  if (clearSight(from, to, PLAYER_RADIUS + 1)) return direction(from, to);
  const start = nearestOpen(from), goal = nearestOpen(to);
  if (start < 0 || goal < 0) return { x: 0, y: 0 };
  const distances = distanceField(goal);
  if (distances[start] < 0) return { x: 0, y: 0 };
  const next = neighbors(start).filter(n => distances[n] >= 0 && distances[n] < distances[start])
    .sort((a, b) => distances[a] - distances[b])
    .find(n => clearSight(from, center(n), PLAYER_RADIUS));
  return direction(from, center(next ?? start));
}
