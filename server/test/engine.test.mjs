import test from 'node:test';
import assert from 'node:assert/strict';
import { createBattle, publicState, requestDefense, requestMagic, submitInput, tick } from '../src/engine.mjs';
import { blocked, routeDirection } from '../src/navigation.mjs';

const profile = { guestId: 'test-guest', name: '測試者', drinks: [], equippedDrinkId: null };

test('81 reference screens have four clear corner spawns and no opening target', () => {
  const state = createBattle(profile);
  assert.equal(state.arena.width, state.arena.viewport.width * 9);
  assert.equal(state.arena.height, state.arena.viewport.height * 9);
  const quadrants = new Set(state.players.map(p => `${p.x < state.arena.width / 2},${p.y < state.arena.height / 2}`));
  assert.equal(quadrants.size, 4);
  for (const actor of state.players) assert.ok(!blocked(actor.x, actor.y, 15));
  tick(state, 0);
  assert.equal(state.players[0].targetId, null);
  assert.equal(publicState(state).players.length, 1);
});

test('room is server owned; forged state fields and excessive movement are ignored', () => {
  const state = createBattle(profile);
  assert.equal(state.players.length, 4);
  state.players[0].x = 350; state.players[0].y = 480;
  state.players[1].x = 240; state.players[1].y = 480;
  state.players[2].x = 570; state.players[2].y = 480;
  const before = state.players[0].x;
  submitInput(state, profile, { move: { x: 999, y: 0 }, aim: { x: -1, y: 0 },
    shoot: true, slot: 999, x: 9999, hp: 9999, damage: 9999, winnerId: profile.guestId });
  state.time = 6; // Attack is available after the shared opening countdown.
  tick(state, 0.05);
  assert.ok(state.players[0].x <= before + 9.01);
  assert.ok(state.players[0].hp <= 100);
  assert.equal(state.players[0].slot, 0);
  assert.equal(state.winnerId, null);
  assert.ok(state.projectiles.some(shot => shot.ownerId === profile.guestId));
});

test('equipped topping leaves the server-defined straw tip and forged ammo is ignored', () => {
  const state = createBattle(profile);
  const actor = state.players[0];
  actor.x = 350; actor.y = 480;
  state.players[1].x = 240; state.players[1].y = 480;
  state.players[2].x = 570; state.players[2].y = 480;
  actor.toppingIds = ['pearl', 'grass_jelly'];
  state.time = 6;
  submitInput(state, profile, { move: { x: 0, y: 0 }, aim: { x: 1, y: 0 },
    shoot: true, slot: 1, toppingId: 'boba', projectileX: 9999, targetId: state.players[2].id });
  tick(state, 0);
  const shot = state.projectiles.find(p => p.ownerId === actor.id);
  assert.ok(shot);
  assert.equal(actor.targetId, state.players[1].id);
  assert.equal(actor.facing, -1);
  assert.equal(shot.toppingId, 'grass_jelly');
  assert.equal(shot.x, actor.x - state.arena.projectileOrigin.mouthSide - state.arena.projectileOrigin.blowLean - state.arena.projectileOrigin.forward);
  assert.equal(shot.y, actor.y + state.arena.projectileOrigin.height);
  assert.equal(shot.angle, Math.PI);
  assert.equal(publicState(state).projectiles.find(p => p.id === shot.id)?.toppingId, 'grass_jelly');
});

test('automatic target switches sides and never locks a hidden opponent', () => {
  const state = createBattle(profile);
  const actor = state.players[0];
  actor.x = 450; actor.y = 450;
  state.players[1].x = 210; state.players[1].y = 450;
  state.players[2].x = 510; state.players[2].y = 450;
  tick(state, 0);
  assert.equal(actor.targetId, state.players[2].id);
  assert.equal(actor.facing, 1);
  assert.equal(actor.angle, 0);
  actor.x = 650; actor.y = 450;
  state.players[1].x = 750; state.players[1].y = 450;
  state.players[2].x = 450; state.players[2].y = 450;
  tick(state, 0);
  assert.equal(actor.targetId, state.players[1].id);
});

test('straw-height projectile can hit an opponent at body height', () => {
  const state = createBattle(profile);
  state.players[1].isBot = false;
  state.players[0].x = 350; state.players[0].y = 480;
  state.players[1].x = 280;
  state.players[1].y = 480;
  state.time = 6;
  submitInput(state, profile, { move: { x: 0, y: 0 }, aim: { x: -1, y: 0 }, shoot: true });
  tick(state, .05);
  assert.ok(state.players[1].hp < 100);
  assert.ok(state.events.some(e => e.type === 'damage' && e.targetId === state.players[1].id));
});

test('server reaches a result and logs it', () => {
  const state = createBattle(profile);
  for (let i = 0; i < 4900 && state.status === 'playing'; i++) tick(state, 0.05);
  assert.equal(state.status, 'finished');
  assert.ok(state.events.some(event => event.type === 'finish'));
  assert.ok(state.time <= state.arena.zoneTiming.limit + .05);
});

test('opponents in an alley are hidden until the player enters that alley', () => {
  const state = createBattle(profile);
  const hiddenId = state.players[3].id;
  state.players[3].x = 200; state.players[3].y = 350;
  state.players[0].x = 200; state.players[0].y = 450;
  assert.equal(publicState(state).aliveCount, 4);
  assert.ok(!publicState(state).players.some(p => p.id === hiddenId));
  state.players[0].x = 220;
  state.players[0].y = 350;
  assert.ok(publicState(state).players.some(p => p.id === hiddenId));
  state.players[0].x = 200;
  state.players[0].y = 450;
  assert.ok(!publicState(state).players.some(p => p.id === hiddenId));
});

test('street route can actually reach the covered alley entrance', () => {
  const state = createBattle(profile);
  for (const bot of state.players.slice(1)) bot.isBot = false;
  state.players[3].x = 200; state.players[3].y = 350;
  const actor = state.players[0];
  for (const waypoint of [{ x: 45, y: 450 }, { x: 200, y: 450 }, { x: 200, y: 350 }]) {
    for (let step = 0; step < 100 && Math.hypot(actor.x - waypoint.x, actor.y - waypoint.y) > 10; step++) {
      const dx = waypoint.x - actor.x, dy = waypoint.y - actor.y, length = Math.hypot(dx, dy) || 1;
      submitInput(state, profile, { move: { x: dx / length, y: dy / length }, aim: { x: 1, y: 0 }, shoot: false });
      tick(state, 0.05);
    }
    assert.ok(Math.hypot(actor.x - waypoint.x, actor.y - waypoint.y) < 16, `could not reach ${waypoint.x},${waypoint.y}`);
  }
  assert.ok(publicState(state).players.some(p => p.id === state.players[3].id));
});

test('square cover blocks sight and moving around it reveals an opponent', () => {
  const state = createBattle(profile);
  const actor = state.players[0], opponent = state.players[1];
  actor.x = 45; actor.y = 200;
  opponent.x = 350; opponent.y = 200;
  assert.ok(!publicState(state).players.some(p => p.id === opponent.id));
  actor.x = 450; actor.y = 380;
  assert.ok(publicState(state).players.some(p => p.id === opponent.id));
});

test('the safe area starts full size, shrinks after 30 seconds, and damages outside players', () => {
  const state = createBattle(profile);
  assert.equal(state.zone.halfWidth, state.arena.width / 2);
  assert.equal(state.zone.halfHeight, state.arena.height / 2);
  state.time = 29;
  tick(state, 0.05);
  assert.equal(state.zone.halfWidth, state.arena.width / 2);
  assert.equal(state.zone.halfHeight, state.arena.height / 2);
  state.time = 45;
  tick(state, 0.05);
  assert.ok(state.zone.halfWidth < state.arena.width / 2);
  assert.ok(state.zone.halfHeight < state.arena.height / 2);
  assert.equal(state.events.filter(e => e.type === 'zone').length, 1);
  const actor = state.players[0];
  actor.x = 45; actor.y = 100; actor.damageTick = .49;
  tick(state, .05);
  assert.ok(actor.hp < 100);
});

test('holding fire launches a continuous string of pearls', () => {
  const state = createBattle(profile);
  state.players[0].x = 350; state.players[0].y = 480;
  state.players[1].x = 160; state.players[1].y = 480;
  state.time = 6;
  submitInput(state, profile, { move: { x: 0, y: 0 }, shoot: true });
  for (let i = 0; i < 20; i++) tick(state, .05);
  assert.ok(state.events.filter(e => e.type === 'shoot' && e.actorId === profile.guestId).length >= 4);
});

test('all four corners can reach the central street through real movement', () => {
  for (const spawn of createBattle(profile).arena.spawns) {
    const state = createBattle(profile);
    for (const bot of state.players.slice(1)) bot.isBot = false;
    const actor = state.players[0];
    Object.assign(actor, spawn);
    const goal = { x: state.zone.x, y: state.zone.y };
    for (let step = 0; step < 1400 && Math.hypot(actor.x - goal.x, actor.y - goal.y) > 20; step++) {
      submitInput(state, profile, { move: routeDirection(actor, goal), shoot: false });
      tick(state, .05);
      assert.ok(!blocked(actor.x, actor.y, 15), 'route entered an obstacle');
      assert.ok(actor.alive, 'route failed to outrun the shrinking area');
    }
    assert.ok(Math.hypot(actor.x - goal.x, actor.y - goal.y) <= 20,
      `corner ${spawn.x},${spawn.y} got stuck at ${actor.x},${actor.y}`);
  }
});

test('dairy magic is server-owned, has cooldown, and reaches the battle log', () => {
  for (const [dairyId, expectedDamage] of [['milk', 12], ['creamer', 10], ['milk_cap', 13]]) {
    const state = createBattle(profile);
    state.players.slice(1).forEach(p => { p.isBot = false; p.x = 7000; p.y = 2400; });
    const actor = state.players[0], enemy = state.players[1];
    actor.x = 350; actor.y = 480; actor.drink = { ...actor.drink, dairyId };
    enemy.x = 280; enemy.y = 480;
    state.time = 6;
    assert.equal(requestMagic(state, profile), true, `${dairyId} should cast`);
    assert.equal(requestMagic(state, profile), false, `${dairyId} cooldown should prevent double cast`);
    for (let i = 0; i < 14; i++) tick(state, .1);
    assert.equal(enemy.hp, 100 - expectedDamage, `${dairyId} should hit for its server-defined damage`);
    assert.ok(state.events.some(e => e.type === 'magic_cast' && e.magicId === dairyId));
    assert.ok(state.events.some(e => e.type === 'damage' && e.actorId === actor.id && e.targetId === enemy.id));
    assert.ok(actor.magicCooldown > 0);
  }
});

test('a player without dairy cannot cast and incoming forged fields never set magic damage', () => {
  const state = createBattle(profile);
  const actor = state.players[0];
  actor.drink = { ...actor.drink, dairyId: null };
  state.time = 6;
  submitInput(state, profile, { move: { x: 0, y: 0 }, shoot: false,
    magicId: 'milk_cap', magicDamage: 999, magicCooldown: 0, cast: true });
  assert.equal(requestMagic(state, profile), false);
  assert.equal(state.magicEffects.length, 0);
  assert.equal(actor.magicCooldown, 0);
});

test('milk beam cannot damage an enemy behind street cover', () => {
  const state = createBattle(profile);
  state.players.slice(1).forEach(p => { p.isBot = false; p.x = 7000; p.y = 2400; });
  const actor = state.players[0], enemy = state.players[1];
  actor.x = 45; actor.y = 200; enemy.x = 350; enemy.y = 200;
  actor.drink = { ...actor.drink, dairyId: 'milk' };
  state.time = 6;
  assert.equal(requestMagic(state, profile), true);
  for (let i = 0; i < 6; i++) tick(state, .1);
  assert.equal(enemy.hp, 100);
});

function incomingShot(state, owner, target, amount) {
  state.projectiles.push({ id: `test-shot-${state.projectiles.length}`, ownerId: owner.id,
    x: target.x, y: target.y + state.arena.projectileOrigin.height, vx: 0, vy: 0,
    angle: 0, radius: 6, toppingId: 'pearl', damage: amount, remaining: 1,
    originZoneId: null });
}

test('red tea shield absorbs attacks, logs blocks, and cannot be forged from a client packet', () => {
  const state = createBattle(profile);
  state.players.slice(1).forEach(p => { p.isBot = false; p.x = 7000; p.y = 2400; });
  const actor = state.players[0], enemy = state.players[1];
  actor.x = 350; actor.y = 480; state.time = 6;
  submitInput(state, profile, { move: { x: 0, y: 0 }, shoot: false,
    defenseId: 'green_tea', shield: 999, defenseCooldown: 0 });
  assert.equal(requestDefense(state, profile), true);
  assert.equal(requestDefense(state, profile), false);
  assert.equal(actor.defense.shield, 24);
  incomingShot(state, enemy, actor, 10); tick(state, 0);
  assert.equal(actor.hp, 100);
  assert.equal(actor.defense.shield, 14);
  incomingShot(state, enemy, actor, 20); tick(state, 0);
  assert.equal(actor.hp, 94);
  assert.equal(actor.defense, null);
  assert.ok(state.events.some(e => e.type === 'block' && e.absorbed === 14));
});

test('green tea dodge evades player attacks, moves by server speed, and stops at cover', () => {
  const state = createBattle(profile);
  state.players.slice(1).forEach(p => { p.isBot = false; p.x = 7000; p.y = 2400; });
  const actor = state.players[0], enemy = state.players[1];
  actor.x = 350; actor.y = 480; actor.drink = { ...actor.drink, baseId: 'green_tea' };
  state.time = 6;
  submitInput(state, profile, { move: { x: 1, y: 0 }, shoot: false, dashDistance: 9999 });
  assert.equal(requestDefense(state, profile, { x: 9999, y: 0 }), true);
  incomingShot(state, enemy, actor, 50); tick(state, 0);
  assert.equal(actor.hp, 100);
  assert.ok(state.events.some(e => e.type === 'evade'));
  const before = actor.x;
  tick(state, .1);
  assert.ok(actor.x > before && actor.x <= before + 30.01);
  actor.x = 80; actor.y = 200; actor.defense = null; actor.defenseCooldown = 0;
  submitInput(state, profile, { move: { x: 1, y: 0 }, shoot: false });
  assert.equal(requestDefense(state, profile), true);
  tick(state, .1);
  assert.equal(actor.x, 80);
  assert.equal(actor.defense, null);
});

test('tea defenses never absorb shrinking-zone damage', () => {
  const state = createBattle(profile);
  const actor = state.players[0];
  state.time = 45; actor.x = 45; actor.y = 100; actor.damageTick = .49;
  assert.equal(requestDefense(state, profile), true);
  tick(state, .05);
  assert.equal(actor.hp, 93);
  assert.equal(actor.defense.shield, 24);
});
