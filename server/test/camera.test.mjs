import test from 'node:test';
import assert from 'node:assert/strict';
import { cameraFor } from '../../client/src/game/camera.ts';
import { arena } from '../src/arena.mjs';

test('phone camera shows one reference screen, not the whole world', () => {
  const camera = cameraFor({ width: 828, height: 280 }, arena, { x: 4050, y: 1350 });
  assert.ok(Math.abs(camera.width - 900) < 1);
  assert.ok(camera.height >= 300 && camera.height < 305);
  assert.equal(camera.x + camera.width / 2, 4050);
  const moved = cameraFor({ width: 828, height: 280 }, arena, { x: 4950, y: 1650 });
  assert.equal(moved.x - camera.x, 900);
  assert.equal(moved.y - camera.y, 300);
  assert.equal(moved.scale, camera.scale);
});

test('camera clamps to all four map corners without showing outside the world', () => {
  for (const size of [{ width: 828, height: 280 }, { width: 643, height: 254 }, { width: 1280, height: 748 }]) {
    for (const player of arena.spawns) {
      const c = cameraFor(size, arena, player);
      assert.ok(c.x >= 0 && c.y >= 0);
      assert.ok(c.x + c.width <= arena.width + .001);
      assert.ok(c.y + c.height <= arena.height + .001);
      assert.ok(player.x >= c.x && player.x <= c.x + c.width);
      assert.ok(player.y >= c.y && player.y <= c.y + c.height);
    }
  }
});
