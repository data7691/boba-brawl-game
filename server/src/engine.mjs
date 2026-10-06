import { randomUUID } from 'node:crypto';
import { arena, dairyMagic, teaDefense, weapons } from './catalog.mjs';
import { getEquippedDrink } from './store.mjs';
import { blocked, clearSight, routeDirection } from './navigation.mjs';

const DT = 1 / 20;
const PLAYER_RADIUS = 15;
const MOVE_SPEED = 180;
const WARMUP_SECONDS = 6;
const SPAWNS = arena.spawns;
const BOT_NAMES = ['街角奶霸', '仙草忍者', '波霸獵手'];
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const outsideZone = (point, zone, margin = 0) => Math.abs(point.x - zone.x) > zone.halfWidth - margin ||
  Math.abs(point.y - zone.y) > zone.halfHeight - margin;
const norm = v => {
  const len = Math.hypot(v.x, v.y);
  return len > 0 ? { x: v.x / len, y: v.y / len } : { x: 0, y: 0 };
};
const hiddenZoneAt = p => arena.hiddenZones.find(zone => p.x >= zone.x && p.x <= zone.x + zone.width && p.y >= zone.y && p.y <= zone.y + zone.height);
const canSee = (viewer, target) => {
  if (viewer.id === target.id || !target.alive) return true;
  if (distance(viewer, target) > arena.sightRange) return false;
  const hidden = hiddenZoneAt(target);
  return (!hidden || hiddenZoneAt(viewer)?.id === hidden.id) && clearSight(viewer, target);
};

function event(state, type, text, extra = {}) {
  state.events.push({ seq: ++state.eventSeq, time: Math.round(state.time * 10) / 10, type, text, ...extra });
}

function player(id, name, isBot, spawn, drink) {
  return {
    id, name, isBot, x: spawn.x, y: spawn.y, angle: 0, facing: 1, targetId: null, hp: 100, maxHp: 100,
    alive: true, moving: false, blowing: false, slot: 0, toppingIds: drink.toppingIds, drink,
    cooldown: 0, magicCooldown: 0, defenseCooldown: 0, defense: null,
    input: { move: { x: 0, y: 0 }, aim: { x: 1, y: 0 }, shoot: false },
    inputAt: 0, damageTick: 0,
  };
}

export function createBattle(profile) {
  const botDrinks = [
    { baseId: 'green_tea', dairyId: null, toppingIds: ['pearl', 'boba'] },
    { baseId: 'red_tea', dairyId: 'milk', toppingIds: ['grass_jelly', 'pearl'] },
    { baseId: 'green_tea', dairyId: 'creamer', toppingIds: ['white_pearl', 'peanut'] },
  ];
  const state = {
    id: randomUUID(), ownerId: profile.guestId, status: 'playing', time: 0, arena,
    zone: { x: arena.width / 2, y: arena.height / 2,
      halfWidth: arena.width / 2, halfHeight: arena.height / 2, shape: 'rectangle' },
    players: [player(profile.guestId, profile.name, false, SPAWNS[0], getEquippedDrink(profile)),
      ...BOT_NAMES.map((name, i) => player(`bot-${i + 1}`, name, true, SPAWNS[i + 1], botDrinks[i]))],
    projectiles: [], magicEffects: [], winnerId: null, events: [], eventSeq: 0, zoneAnnounced: false, lastTick: Date.now(),
  };
  event(state, 'start', '9 × 9 信義街區大亂鬥・四角出生');
  return state;
}

export function submitInput(state, profile, input) {
  if (state.status !== 'playing') return;
  const actor = state.players.find(p => p.id === profile.guestId);
  if (!actor?.alive) return;
  // Never accept client coordinates, HP, projectiles, hits, damage or victory.
  const safeVector = v => {
    if (!v || !Number.isFinite(v.x) || !Number.isFinite(v.y)) return { x: 0, y: 0 };
    return norm({ x: clamp(v.x, -1, 1), y: clamp(v.y, -1, 1) });
  };
  const move = safeVector(input.move);
  if (Number.isInteger(input.slot) && input.slot >= 0 && input.slot < actor.toppingIds.length) actor.slot = input.slot;
  // Human aim and target IDs are decided by the server, never by the client packet.
  actor.input = { move, aim: actor.input.aim, shoot: input.shoot === true };
  actor.inputAt = Date.now();
}

function beginMagic(state, actor) {
  const type = actor.drink.dairyId;
  const spell = dairyMagic[type];
  if (!actor.alive || !spell || actor.magicCooldown > 0 || state.time < WARMUP_SECONDS ||
      actor.defense?.type === 'green_tea') return false;
  const target = nearestTarget(state, actor);
  const aim = target ? aimAt(actor, target) : { x: Math.cos(actor.angle), y: Math.sin(actor.angle) };
  actor.magicCooldown = spell.cooldown;
  actor.angle = Math.atan2(aim.y, aim.x);
  if (Math.abs(aim.x) > .01) actor.facing = aim.x < 0 ? -1 : 1;
  state.magicEffects.push({ id: randomUUID(), type, ownerId: actor.id, x: actor.x, y: actor.y,
    aimX: aim.x, aimY: aim.y, age: 0, phase: 'windup', traveled: 0, hitIds: [],
    originZoneId: hiddenZoneAt(actor)?.id ?? null });
  event(state, 'magic_cast', `${actor.name} 施放${spell.name}`, { actorId: actor.id, magicId: type });
  return true;
}

export function requestMagic(state, profile) {
  if (state.status !== 'playing') return false;
  const actor = state.players.find(p => p.id === profile.guestId);
  return actor ? beginMagic(state, actor) : false;
}

function beginDefense(state, actor, move = actor.input.move) {
  const type = actor.drink.baseId;
  const skill = teaDefense[type];
  if (!actor.alive || !skill || actor.defenseCooldown > 0 || state.time < WARMUP_SECONDS) return false;
  actor.defenseCooldown = skill.cooldown;
  const direction = norm(move);
  actor.defense = type === 'red_tea'
    ? { type, remaining: skill.duration, shield: skill.absorb }
    : { type, remaining: skill.duration,
      direction: direction.x || direction.y ? direction : { x: Math.cos(actor.angle), y: Math.sin(actor.angle) } };
  event(state, 'defense_cast', `${actor.name} 使用${skill.name}`, { actorId: actor.id, defenseId: type });
  return true;
}

export function requestDefense(state, profile, requestedMove) {
  if (state.status !== 'playing') return false;
  const actor = state.players.find(p => p.id === profile.guestId);
  if (!actor) return false;
  const move = requestedMove && Number.isFinite(requestedMove.x) && Number.isFinite(requestedMove.y)
    ? norm({ x: clamp(requestedMove.x, -1, 1), y: clamp(requestedMove.y, -1, 1) })
    : actor.input.move;
  return beginDefense(state, actor, move);
}

function moveActor(actor, delta, dt) {
  const move = norm(delta);
  const step = MOVE_SPEED * dt;
  const nx = clamp(actor.x + move.x * step, PLAYER_RADIUS, arena.width - PLAYER_RADIUS);
  if (!blocked(nx, actor.y, PLAYER_RADIUS)) actor.x = nx;
  const ny = clamp(actor.y + move.y * step, PLAYER_RADIUS, arena.height - PLAYER_RADIUS);
  if (!blocked(actor.x, ny, PLAYER_RADIUS)) actor.y = ny;
}

function stepDodge(actor, dt) {
  const skill = teaDefense.green_tea;
  const direction = actor.defense.direction;
  const nx = clamp(actor.x + direction.x * skill.speed * dt, PLAYER_RADIUS, arena.width - PLAYER_RADIUS);
  const ny = clamp(actor.y + direction.y * skill.speed * dt, PLAYER_RADIUS, arena.height - PLAYER_RADIUS);
  if (blocked(nx, ny, PLAYER_RADIUS)) { actor.defense = null; return; }
  actor.x = nx; actor.y = ny;
}

function botInput(state, actor) {
  const targets = state.players.filter(p => p.alive && p.id !== actor.id && canSee(actor, p, state.time));
  if (!targets.length) {
    const patrol = { x: state.zone.x, y: state.zone.y };
    return { move: routeDirection(actor, patrol), aim: actor.input.aim, shoot: false };
  }
  const target = targets.reduce((a, b) => distance(a, actor) < distance(b, actor) ? a : b);
  const toTarget = norm({ x: target.x - actor.x, y: target.y - actor.y });
  const outside = outsideZone(actor, state.zone, 70);
  const d = distance(actor, target);
  const lineOfSight = clearSight(actor, target);
  const move = outside ? routeDirection(actor, state.zone) : !lineOfSight || d > 170 ? routeDirection(actor, target) : d < 100 ? { x: -toTarget.x, y: -toTarget.y } :
    { x: -toTarget.y * (actor.id === 'bot-2' ? -1 : 1), y: toTarget.x * (actor.id === 'bot-2' ? -1 : 1) };
  actor.slot = Math.floor(state.time / 7 + Number(actor.id.at(-1))) % actor.toppingIds.length;
  // Slight aim variance leaves room for a human to dodge.
  const wobble = Math.sin(state.time * 2.2 + Number(actor.id.at(-1)) * 3) * 0.18;
  return { move, aim: norm({ x: toTarget.x - toTarget.y * wobble, y: toTarget.y + toTarget.x * wobble }), shoot: d < 260 && lineOfSight };
}

function nearestTarget(state, actor) {
  return state.players
    .filter(p => p.alive && p.id !== actor.id && canSee(actor, p, state.time))
    .sort((a, b) => distance(actor, a) - distance(actor, b) || a.id.localeCompare(b.id))
    .find(target => clearSight(actor, target));
}

function aimAt(actor, target) {
  const facing = target.x < actor.x ? -1 : 1;
  const mouthX = actor.x + facing * (arena.projectileOrigin.mouthSide + (actor.blowing ? arena.projectileOrigin.blowLean : 0));
  return norm({ x: target.x - mouthX, y: target.y - actor.y });
}

function shoot(state, actor, aim) {
  if (actor.cooldown > 0) return;
  const toppingId = actor.toppingIds[actor.slot] ?? actor.toppingIds[0];
  const weapon = weapons[toppingId] ?? weapons.pearl;
  const direction = norm(aim);
  if (!(direction.x || direction.y)) return;
  const origin = arena.projectileOrigin;
  const muzzleX = actor.x + actor.facing * (origin.mouthSide + (actor.blowing ? origin.blowLean : 0)) + direction.x * origin.forward;
  const muzzleY = actor.y + origin.height + direction.y * origin.forward;
  if (muzzleX < weapon.radius || muzzleX > arena.width - weapon.radius ||
      muzzleY < weapon.radius || muzzleY > arena.height - weapon.radius ||
      blocked(muzzleX, muzzleY - origin.height, weapon.radius)) return;
  actor.cooldown = weapon.cooldown;
  actor.angle = Math.atan2(direction.y, direction.x);
  state.projectiles.push({
    id: randomUUID(), ownerId: actor.id, x: muzzleX,
    y: muzzleY, vx: direction.x * weapon.speed,
    vy: direction.y * weapon.speed, angle: actor.angle, radius: weapon.radius, toppingId,
    damage: weapon.damage, remaining: weapon.range / weapon.speed,
    originZoneId: hiddenZoneAt(actor)?.id ?? null,
  });
  event(state, 'shoot', `${actor.name} 用吸管吹出配料`, { actorId: actor.id, toppingId, muzzleX, muzzleY });
}

function damage(state, target, amount, sourceId, reason) {
  if (!target.alive) return 0;
  if (sourceId && target.defense?.type === 'green_tea') {
    event(state, 'evade', `${target.name} 閃過${reason}`, { actorId: sourceId, targetId: target.id });
    return 0;
  }
  if (sourceId && target.defense?.type === 'red_tea') {
    const absorbed = Math.min(amount, target.defense.shield);
    target.defense.shield -= absorbed;
    amount -= absorbed;
    event(state, 'block', `${target.name} 的紅茶茶盾擋下 ${absorbed} 傷害`,
      { actorId: sourceId, targetId: target.id, absorbed, shield: target.defense.shield });
    if (target.defense.shield <= 0) target.defense = null;
    if (amount <= 0) return 0;
  }
  const before = target.hp;
  target.hp = Math.max(0, Math.round((target.hp - amount) * 10) / 10);
  event(state, 'damage', `${target.name} 受到 ${Math.round(amount)} 點${reason}傷害`,
    { actorId: sourceId, targetId: target.id, before, after: target.hp, amount });
  if (target.hp <= 0) {
    target.alive = false;
    target.moving = false;
    event(state, 'elimination', `${target.name} 淘汰`, { targetId: target.id, actorId: sourceId });
  }
  return before - target.hp;
}

function resolveMagic(state, effect) {
  const spell = dairyMagic[effect.type];
  const owner = state.players.find(p => p.id === effect.ownerId);
  if (!owner?.alive) return;
  if (effect.type === 'creamer') {
    for (const target of state.players) {
      if (target.id === owner.id || !target.alive || distance(effect, target) > spell.radius + PLAYER_RADIUS ||
          (hiddenZoneAt(target)?.id ?? null) !== effect.originZoneId || !clearSight(effect, target)) continue;
      damage(state, target, spell.damage, owner.id, spell.name);
    }
  } else if (effect.type === 'milk') {
    let length = 0;
    for (let step = 8; step <= spell.range; step += 8) {
      const point = { x: effect.x + effect.aimX * step, y: effect.y + effect.aimY * step };
      if (point.x < 0 || point.x > arena.width || point.y < 0 || point.y > arena.height ||
          blocked(point.x, point.y, 2) || (hiddenZoneAt(point)?.id ?? null) !== effect.originZoneId) break;
      length = step;
    }
    effect.length = length;
    const hit = state.players.filter(p => p.alive && p.id !== owner.id).map(target => {
      const dx = target.x - effect.x, dy = target.y - effect.y;
      return { target, along: dx * effect.aimX + dy * effect.aimY,
        across: Math.abs(dx * effect.aimY - dy * effect.aimX) };
    }).filter(hit => hit.along >= 0 && hit.along <= length && hit.across <= spell.halfWidth + PLAYER_RADIUS &&
      (hiddenZoneAt(hit.target)?.id ?? null) === effect.originZoneId && clearSight(effect, hit.target))
      .sort((a, b) => a.along - b.along)[0];
    if (hit) {
      const dealt = damage(state, hit.target, spell.damage, owner.id, spell.name);
      if (dealt > 0) {
        const before = owner.hp;
        owner.hp = Math.min(owner.maxHp, owner.hp + spell.healOnHit);
        if (owner.hp > before) event(state, 'heal', `${owner.name} 回復 ${owner.hp - before} HP`,
          { actorId: owner.id, before, after: owner.hp, amount: owner.hp - before });
      }
    }
  }
}

function stepMagic(state, dt) {
  state.magicEffects = state.magicEffects.filter(effect => {
    const spell = dairyMagic[effect.type];
    const owner = state.players.find(p => p.id === effect.ownerId);
    if (!owner?.alive) return false;
    effect.age += dt;
    if (effect.phase === 'windup') {
      if (effect.age < spell.windup) return true;
      effect.phase = 'active'; effect.age = 0;
      if (effect.type !== 'milk_cap') resolveMagic(state, effect);
      return true;
    }
    if (effect.type === 'milk_cap') {
      const previous = effect.traveled;
      effect.traveled = Math.min(spell.range, effect.traveled + spell.speed * dt);
      for (let step = previous + 8; step <= effect.traveled + 8; step += 8) {
        const x = effect.x + effect.aimX * Math.min(step, effect.traveled);
        const y = effect.y + effect.aimY * Math.min(step, effect.traveled);
        if (x < 0 || x > arena.width || y < 0 || y > arena.height ||
            blocked(x, y, spell.width / 3) || (hiddenZoneAt({ x, y })?.id ?? null) !== effect.originZoneId) return false;
      }
      const frontX = effect.x + effect.aimX * effect.traveled;
      const frontY = effect.y + effect.aimY * effect.traveled;
      for (const target of state.players) {
        if (!target.alive || target.id === owner.id || effect.hitIds.includes(target.id) ||
            (hiddenZoneAt(target)?.id ?? null) !== effect.originZoneId || !clearSight(effect, target)) continue;
        const dx = target.x - effect.x, dy = target.y - effect.y;
        const along = dx * effect.aimX + dy * effect.aimY;
        const across = Math.abs(dx * effect.aimY - dy * effect.aimX);
        if (along < previous - PLAYER_RADIUS || along > effect.traveled + PLAYER_RADIUS ||
            across > spell.width / 2 + PLAYER_RADIUS) continue;
        effect.hitIds.push(target.id);
        damage(state, target, spell.damage, owner.id, spell.name);
        if (target.alive) {
          const pushed = { x: clamp(target.x + effect.aimX * spell.push, PLAYER_RADIUS, arena.width - PLAYER_RADIUS),
            y: clamp(target.y + effect.aimY * spell.push, PLAYER_RADIUS, arena.height - PLAYER_RADIUS) };
          if (!blocked(pushed.x, pushed.y, PLAYER_RADIUS) &&
              (outsideZone(target, state.zone) || !outsideZone(pushed, state.zone))) {
            target.x = pushed.x; target.y = pushed.y;
          }
        }
      }
      effect.frontX = frontX; effect.frontY = frontY;
      return effect.traveled < spell.range;
    }
    return effect.age < (effect.type === 'milk' ? .24 : .4);
  });
}

export function tick(state, dt = DT) {
  if (state.status !== 'playing') return;
  dt = clamp(dt, 0, 0.1);
  state.time = Math.round((state.time + dt) * 1000) / 1000;
  const timing = arena.zoneTiming;
  const progress = clamp((state.time - timing.start) / (timing.finalArea - timing.start), 0, 1);
  const collapse = 1 - clamp((state.time - timing.finalArea) / (timing.collapse - timing.finalArea), 0, 1);
  state.zone.halfWidth = (arena.width / 2 - progress * (arena.width - arena.viewport.width) / 2) * collapse;
  state.zone.halfHeight = (arena.height / 2 - progress * (arena.height - arena.viewport.height) / 2) * collapse;
  if (state.time >= timing.start && !state.zoneAnnounced) {
    state.zoneAnnounced = true;
    event(state, 'zone', '安全區開始縮小，往中央街區移動');
  }
  for (const actor of state.players) {
    if (!actor.alive) continue;
    actor.cooldown = Math.max(0, actor.cooldown - dt);
    actor.magicCooldown = Math.max(0, actor.magicCooldown - dt);
    actor.defenseCooldown = Math.max(0, actor.defenseCooldown - dt);
    const input = actor.isBot ? botInput(state, actor) :
      Date.now() - actor.inputAt <= 300 ? actor.input : { ...actor.input, move: { x: 0, y: 0 }, shoot: false };
    const beforeMove = { x: actor.x, y: actor.y };
    if (actor.defense?.type === 'green_tea') stepDodge(actor, dt);
    else moveActor(actor, input.move, dt);
    if (actor.defense) {
      actor.defense.remaining -= dt;
      if (actor.defense.remaining <= 0) actor.defense = null;
    }
    actor.moving = distance(actor, beforeMove) > 0.1;
    const target = actor.isBot ? null : nearestTarget(state, actor);
    actor.targetId = target?.id ?? null;
    actor.blowing = input.shoot && state.time >= WARMUP_SECONDS && actor.defense?.type !== 'green_tea' &&
      (actor.isBot || Boolean(target));
    const aim = target ? aimAt(actor, target) : actor.isBot ? input.aim :
      actor.moving ? norm(input.move) : { x: Math.cos(actor.angle), y: Math.sin(actor.angle) };
    if (aim.x || aim.y) {
      actor.angle = Math.atan2(aim.y, aim.x);
      if (Math.abs(aim.x) > .01) actor.facing = aim.x < 0 ? -1 : 1;
    }
    if (actor.blowing) shoot(state, actor, aim);
    if (actor.isBot && target === null && state.time >= WARMUP_SECONDS && actor.magicCooldown <= 0) {
      const magicTarget = nearestTarget(state, actor);
      const spell = dairyMagic[actor.drink.dairyId];
      if (magicTarget && spell && distance(actor, magicTarget) <=
          (actor.drink.dairyId === 'milk' ? 500 : actor.drink.dairyId === 'creamer' ? 90 : 250)) beginMagic(state, actor);
    }
    if (actor.isBot && state.time >= WARMUP_SECONDS && actor.defenseCooldown <= 0) {
      const foe = nearestTarget(state, actor);
      if (foe && distance(actor, foe) < 180) beginDefense(state, actor, input.move);
    }
    if (outsideZone(actor, state.zone)) {
      actor.damageTick += dt;
      if (actor.damageTick >= 0.5) {
        damage(state, actor, 7, null, '警戒圈');
        actor.damageTick = 0;
      }
    } else actor.damageTick = 0;
  }
  state.projectiles = state.projectiles.filter(shot => {
    shot.x += shot.vx * dt;
    shot.y += shot.vy * dt;
    shot.remaining -= dt;
    const groundShot = { x: shot.x, y: shot.y - arena.projectileOrigin.height };
    if ((hiddenZoneAt(groundShot)?.id ?? null) !== shot.originZoneId ||
        shot.remaining <= 0 || shot.x < 0 || shot.x > arena.width ||
        groundShot.y < 0 || groundShot.y > arena.height || blocked(groundShot.x, groundShot.y, shot.radius)) return false;
    const hit = state.players.find(p => p.alive && p.id !== shot.ownerId &&
      Math.hypot(p.x - shot.x, p.y + arena.projectileOrigin.height - shot.y) < PLAYER_RADIUS + shot.radius);
    if (hit) { damage(state, hit, shot.damage, shot.ownerId, '配料'); return false; }
    return true;
  });
  stepMagic(state, dt);
  const survivors = state.players.filter(p => p.alive);
  if (survivors.length <= 1) {
    state.status = 'finished';
    state.winnerId = survivors[0]?.id ?? null;
    event(state, 'finish', survivors.length ? `${survivors[0].name} 獲勝！` : '平手，無人生還',
      { winnerId: state.winnerId });
  } else if (state.time >= arena.zoneTiming.limit) {
    const maxHp = Math.max(...survivors.map(p => p.hp));
    const leaders = survivors.filter(p => p.hp === maxHp);
    state.status = 'finished';
    state.winnerId = leaders.length === 1 ? leaders[0].id : null;
    event(state, 'finish', leaders.length === 1 ? `${leaders[0].name} 以剩餘生命值獲勝！` : '時間到，平手',
      { winnerId: state.winnerId });
  }
}

export function publicState(state, viewerId = state.ownerId) {
  const viewer = state.players.find(p => p.id === viewerId);
  const visiblePlayers = state.status === 'playing' && viewer ?
    state.players.filter(p => canSee(viewer, p, state.time)) : state.players;
  const visibleShot = shot => !viewer || state.status !== 'playing' ||
    (distance(viewer, shot) <= arena.sightRange && (!hiddenZoneAt({ x: shot.x, y: shot.y - arena.projectileOrigin.height }) ||
    hiddenZoneAt(viewer)?.id === hiddenZoneAt({ x: shot.x, y: shot.y - arena.projectileOrigin.height })?.id));
  return {
    id: state.id, status: state.status, time: state.time, arena: state.arena,
    zone: state.zone, aliveCount: state.players.filter(p => p.alive).length,
    players: visiblePlayers.map(({ input, inputAt, damageTick, ...p }) => p),
    projectiles: state.projectiles.filter(visibleShot).map(({ vx, vy, damage, remaining, originZoneId, ...shot }) => shot),
    magicEffects: state.magicEffects.filter(effect => visiblePlayers.some(p => p.id === effect.ownerId))
      .map(({ originZoneId, hitIds, ...effect }) => effect),
    winnerId: state.winnerId, events: state.events.slice(-40), lastEventSeq: state.eventSeq,
    warmupRemaining: Math.max(0, Math.ceil(WARMUP_SECONDS - state.time)),
  };
}
