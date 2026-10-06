import type { BattlePlayer, BattleState } from '../models/types';
import { drawHeldDrink } from '../components/avatar/PaperDollRenderer';
import { drawCityMap } from './CityMapRenderer';
import { cameraFor } from './camera';
const fighters = new Image();
fighters.src = '/assets/characters/boba-fighters-v1.png';

const colors: Record<string, string> = {
  pearl: '#4c251a', white_pearl: '#fff1d1', boba: '#351811', grass_jelly: '#241527',
  pudding: '#ffce62', red_bean: '#bd4a3b', coconut_jelly: '#ebfff4',
  mung_bean: '#8b9c42', yellow_jelly: '#ffda5a', peanut: '#d99a61',
};
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const slotChanges = new Map<string, { slot: number; changedAt: number }>();
let slotBattleId = '';

function slotPulse(state: BattleState, player: BattlePlayer, now: number) {
  if (slotBattleId !== state.id) { slotBattleId = state.id; slotChanges.clear(); }
  const previous = slotChanges.get(player.id);
  if (!previous || previous.slot !== player.slot) slotChanges.set(player.id, { slot: player.slot, changedAt: previous ? now : -Infinity });
  return Math.max(0, 1 - (now - (slotChanges.get(player.id)?.changedAt ?? -Infinity)) / 220);
}

export function arenaView(canvas: HTMLCanvasElement, state: BattleState, guestId: string) {
  const rect = canvas.getBoundingClientRect();
  const player = state.players.find(p => p.id === guestId);
  return { rect, ...cameraFor(rect, state.arena, player) };
}

export function pointInArena(canvas: HTMLCanvasElement, state: BattleState, guestId: string, clientX: number, clientY: number) {
  const view = arenaView(canvas, state, guestId);
  return { x: view.x + (clientX - view.rect.left) / view.scale, y: view.y + (clientY - view.rect.top) / view.scale };
}

export function hiddenZoneFor(state: BattleState, player: BattlePlayer | undefined) {
  if (!player) return undefined;
  return state.arena.hiddenZones.find(z => player.x >= z.x && player.x <= z.x + z.width && player.y >= z.y && player.y <= z.y + z.height);
}

function drawProjectile(ctx: CanvasRenderingContext2D, shot: BattleState['projectiles'][number]) {
  const pearl = ['pearl', 'boba', 'white_pearl'].includes(shot.toppingId);
  const r = shot.radius * (pearl ? shot.toppingId === 'boba' ? 1.1 : 1.35 : 1);
  const square = ['grass_jelly', 'coconut_jelly', 'yellow_jelly'].includes(shot.toppingId);
  ctx.save(); ctx.translate(shot.x, shot.y); ctx.rotate(shot.angle);
  if (pearl) {
    const streak = ctx.createLinearGradient(-r * 5, 0, r, 0);
    streak.addColorStop(0, '#ffe1a000'); streak.addColorStop(.65, '#ffd79355'); streak.addColorStop(1, '#fff9eddd');
    ctx.strokeStyle = streak; ctx.lineWidth = Math.max(2, r * .5); ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-r * 5, 0); ctx.lineTo(-r * .6, 0); ctx.stroke();
  }
  for (let i = 3; i >= 1; i--) {
    ctx.globalAlpha = (4 - i) * .08;
    ctx.fillStyle = colors[shot.toppingId] || '#fff';
    ctx.beginPath(); ctx.arc(-r * (1.5 + i * 1.15), 0, Math.max(2, r * (1 - i * .18)), 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.shadowColor = shot.toppingId === 'white_pearl' ? '#e9fff0' : pearl ? '#ffcb84' : colors[shot.toppingId] || '#fff';
  ctx.shadowBlur = pearl ? 20 : 13;
  ctx.strokeStyle = '#fff9dfb8'; ctx.lineWidth = 1.4;
  if (square) {
    ctx.rotate(.22);
    ctx.fillStyle = colors[shot.toppingId];
    ctx.beginPath(); ctx.roundRect(-r, -r, r * 2, r * 2, r * .2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#fff9'; ctx.fillRect(-r * .6, -r * .65, r * .65, r * .28);
  } else if (shot.toppingId === 'pudding') {
    ctx.fillStyle = '#ffcf70';
    ctx.beginPath(); ctx.ellipse(0, 1, r, r * .68, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#9f4c2c'; ctx.beginPath(); ctx.ellipse(0, -r * .38, r * .75, r * .22, 0, 0, Math.PI * 2); ctx.fill();
  } else if (shot.toppingId === 'peanut') {
    ctx.fillStyle = '#d7975c';
    for (const x of [-r * .38, r * .38]) { ctx.beginPath(); ctx.ellipse(x, 0, r * .56, r * .7, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
  } else {
    const white = shot.toppingId === 'white_pearl';
    const gradient = ctx.createRadialGradient(-r * .43, -r * .5, .2, r * .25, r * .25, r * 1.25);
    gradient.addColorStop(0, white ? '#ffffff' : '#fff6d7');
    gradient.addColorStop(.17, white ? '#fffaf0' : '#b87348');
    gradient.addColorStop(.54, white ? '#e7e2d7' : colors[shot.toppingId] || '#fff');
    gradient.addColorStop(1, white ? '#a8a5a8' : '#140b13');
    ctx.fillStyle = gradient;
    ctx.beginPath(); ctx.ellipse(0, 0, r, ['red_bean', 'mung_bean'].includes(shot.toppingId) ? r * .72 : r, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ffffffec'; ctx.beginPath(); ctx.ellipse(-r * .35, -r * .43, r * .24, r * .15, -.4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffe2a180'; ctx.beginPath(); ctx.ellipse(r * .37, r * .35, r * .34, r * .12, -.5, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

function drawMagic(ctx: CanvasRenderingContext2D, state: BattleState) {
  for (const magic of state.magicEffects || []) {
    ctx.save();
    const pulse = .7 + .3 * Math.sin(performance.now() * .03);
    if (magic.type === 'milk') {
      const length = magic.phase === 'windup' ? 520 : magic.length || 0;
      const x = magic.x, y = magic.y + state.arena.projectileOrigin.height;
      const endX = x + magic.aimX * length, endY = y + magic.aimY * length;
      ctx.lineCap = 'round';
      if (magic.phase === 'windup') {
        ctx.strokeStyle = `rgba(255,246,203,${.35 + pulse * .4})`; ctx.lineWidth = 3;
        ctx.setLineDash([16, 10]); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(endX, endY); ctx.stroke();
      } else {
        ctx.shadowColor = '#fffbd9'; ctx.shadowBlur = 28; ctx.strokeStyle = '#fff5c3bb'; ctx.lineWidth = 25;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(endX, endY); ctx.stroke();
        ctx.shadowBlur = 12; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 8;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(endX, endY); ctx.stroke();
      }
    } else if (magic.type === 'creamer') {
      const radius = magic.phase === 'windup' ? 95 * Math.min(1, .45 + magic.age / .35 * .55) : 95;
      const gradient = ctx.createRadialGradient(magic.x, magic.y, 8, magic.x, magic.y, radius);
      gradient.addColorStop(0, magic.phase === 'windup' ? '#fff3dd88' : '#fff8e9dd');
      gradient.addColorStop(.65, '#ead8ff44'); gradient.addColorStop(1, '#fff6f000');
      ctx.fillStyle = gradient; ctx.beginPath(); ctx.arc(magic.x, magic.y, radius, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#fff3ebd9'; ctx.lineWidth = magic.phase === 'windup' ? 2 : 7;
      ctx.shadowColor = '#fff1e4'; ctx.shadowBlur = 18; ctx.beginPath(); ctx.arc(magic.x, magic.y, radius, 0, Math.PI * 2); ctx.stroke();
    } else if (magic.type === 'milk_cap') {
      const distance = magic.phase === 'windup' ? 38 : magic.traveled;
      const x = magic.x + magic.aimX * distance, y = magic.y + magic.aimY * distance;
      const angle = Math.atan2(magic.aimY, magic.aimX);
      ctx.translate(x, y); ctx.rotate(angle);
      ctx.shadowColor = '#fff7cf'; ctx.shadowBlur = 22;
      ctx.strokeStyle = magic.phase === 'windup' ? '#fff9eaa0' : '#fff8e8';
      ctx.lineWidth = magic.phase === 'windup' ? 5 : 17; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(0, -48); ctx.quadraticCurveTo(20, 0, 0, 48); ctx.stroke();
      if (magic.phase === 'active') {
        ctx.strokeStyle = '#e8c9f6bb'; ctx.lineWidth = 5; ctx.beginPath();
        ctx.moveTo(-7, -42); ctx.quadraticCurveTo(12, 0, -7, 42); ctx.stroke();
      }
    }
    ctx.restore();
  }
}

function drawCharacter(ctx: CanvasRenderingContext2D, player: BattlePlayer, index: number, me: boolean, state: BattleState) {
  ctx.save();
  ctx.translate(player.x, player.y);
  const now = performance.now();
  if (player.alive && player.defense) {
    ctx.save();
    if (player.defense.type === 'red_tea') {
      ctx.strokeStyle = '#ffc36b'; ctx.lineWidth = 3.5;
      ctx.shadowColor = '#ffb454'; ctx.shadowBlur = 23;
      ctx.beginPath(); ctx.ellipse(0, -30, 31, 55, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = '#fff2b99e'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.ellipse(0, -30, 36, 59, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.font = 'bold 11px system-ui'; ctx.textAlign = 'center'; ctx.fillStyle = '#fff3c8';
      ctx.fillText(`盾 ${Math.ceil(player.defense.shield || 0)}`, 0, -94);
    } else {
      const direction = player.defense.direction || { x: Math.cos(player.angle), y: Math.sin(player.angle) };
      for (let i = 3; i >= 1; i--) {
        ctx.globalAlpha = .11 + (4 - i) * .08;
        ctx.fillStyle = '#b8ffad'; ctx.shadowColor = '#a3ffb8'; ctx.shadowBlur = 20;
        ctx.beginPath(); ctx.ellipse(-direction.x * i * 12, -25 - direction.y * i * 12, 21, 36, 0, 0, Math.PI * 2); ctx.fill();
      }
    }
    ctx.restore();
  }
  const facing = player.facing < 0 ? -1 : 1;
  const bob = player.moving ? Math.sin(now * .025 + index) * 2.7 : Math.sin(now * .003 + index) * .8;
  const fired = state.events.some(e => e.type === 'shoot' && e.actorId === player.id && state.time - e.time >= 0 && state.time - e.time < .12);
  const blowing = Boolean(player.blowing && player.alive);
  ctx.globalAlpha = player.alive ? 1 : 0.32;
  ctx.fillStyle = me ? '#fff0bd60' : '#1b122090';
  ctx.beginPath(); ctx.ellipse(0, 10, 22, 7, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = me ? '#fff2b4' : '#eab6d5';
  ctx.lineWidth = me ? 3 : 2;
  ctx.shadowColor = me ? '#ffd579' : '#f086bc';
  ctx.shadowBlur = 9;
  ctx.beginPath(); ctx.ellipse(0, 10, 19, 7, 0, 0, Math.PI * 2); ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.save(); ctx.translate(0, bob); ctx.scale(facing, 1);
  // Shear around the feet so the head and cup lean toward the straw while blowing.
  if (blowing) ctx.transform(1, 0, -.21, 1, 0, 0);
  if (player.moving) ctx.rotate(Math.sin(now * .018 + index) * .035);
  if (fighters.complete && fighters.naturalWidth) {
    const sourceWidth = fighters.naturalWidth / 4;
    ctx.drawImage(fighters, index * sourceWidth, 0, sourceWidth, fighters.naturalHeight, -30, -68, 60, 84);
  } else {
    ctx.fillStyle = ['#eab66f', '#bdf09b', '#ceacfc', '#90d4ea'][index] || '#fff';
    ctx.beginPath(); ctx.arc(0, -18, 19, 0, Math.PI * 2); ctx.fill();
  }
  drawHeldDrink(ctx, player.drink, player.slot, player.alive ? slotPulse(state, player, now) : 0,
    ['#f2b77a', '#d4a5a5', '#cca27a', '#d4b0a1'][index] || '#efbd8d');
  ctx.restore();
  if (player.alive) {
    const { forward, height, mouthSide, blowLean } = state.arena.projectileOrigin;
    const mouthX = facing * (mouthSide + (blowing ? blowLean : 0));
    const aimX = Math.cos(player.angle), aimY = Math.sin(player.angle);
    const gripX = mouthX + aimX * 16, gripY = height + aimY * 16;
    // The mirrored sprite's mouth and the server muzzle share one anchor.
    ctx.lineCap = 'round'; ctx.strokeStyle = '#392537'; ctx.lineWidth = 8;
    ctx.beginPath(); ctx.moveTo(facing * 11, -19 + bob); ctx.lineTo(gripX, gripY); ctx.stroke();
    ctx.strokeStyle = ['#f2b77a', '#d4a5a5', '#cca27a', '#d4b0a1'][index] || '#efbd8d';
    ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(gripX - aimX * 6, gripY - aimY * 6); ctx.lineTo(gripX, gripY); ctx.stroke();
    if (blowing) {
      ctx.fillStyle = '#ffd7b6';
      ctx.beginPath(); ctx.ellipse(mouthX - facing * 3, height + 1, 3.5, 2.4, 0, 0, Math.PI * 2); ctx.fill();
    }
    ctx.save(); ctx.translate(mouthX, height); ctx.rotate(player.angle);
    ctx.shadowColor = fired ? '#fff9d0' : '#ffd58a'; ctx.shadowBlur = fired ? 15 : 5;
    ctx.fillStyle = '#493047'; ctx.beginPath(); ctx.roundRect(0, -3, forward, 6, 2); ctx.fill();
    ctx.fillStyle = '#ffe8bc'; ctx.beginPath(); ctx.roundRect(0, -2.1, forward, 3.4, 1); ctx.fill();
    ctx.fillStyle = '#b94760';
    for (let x = 8; x < forward - 3; x += 8) ctx.fillRect(x, -2.1, 2.5, 3.4);
    ctx.fillStyle = '#fff5dd'; ctx.beginPath(); ctx.ellipse(forward, 0, 2.5, 3.5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#56364b'; ctx.beginPath(); ctx.ellipse(forward, 0, 1.1, 2.1, 0, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
    if (me) {
      ctx.strokeStyle = '#fff0bb7a'; ctx.lineWidth = 1.5; ctx.setLineDash([4, 6]);
      ctx.beginPath(); ctx.moveTo(forward + 3, 0); ctx.lineTo(forward + 28, 0); ctx.stroke(); ctx.setLineDash([]);
    }
    if (fired) {
      const topping = player.toppingIds[player.slot] || 'pearl';
      ctx.strokeStyle = '#fff6df'; ctx.lineWidth = 2.5;
      for (const spread of [-1, 1]) {
        ctx.beginPath(); ctx.moveTo(forward + 4, spread * 2);
        ctx.quadraticCurveTo(forward + 13, spread * 8, forward + 20, spread * 11); ctx.stroke();
      }
      ctx.fillStyle = colors[topping] || '#fff'; ctx.shadowColor = '#fff0c5'; ctx.shadowBlur = 20;
      ctx.beginPath(); ctx.arc(forward + 7, 0, Math.min(7, (topping === 'boba' ? 8 : 5)), 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }
  ctx.restore();
  ctx.save(); ctx.translate(player.x, player.y);
  ctx.globalAlpha = player.alive ? 1 : .65;
  ctx.fillStyle = '#130e1de0'; ctx.fillRect(-24, -79, 48, 7);
  ctx.fillStyle = player.hp > 40 ? '#9cf08c' : '#ff8d83'; ctx.fillRect(-24, -79, 48 * clamp(player.hp / player.maxHp, 0, 1), 7);
  ctx.textAlign = 'center'; ctx.font = '800 12px system-ui'; ctx.lineWidth = 3;
  ctx.strokeStyle = '#1b1525'; ctx.strokeText(player.name, 0, -84);
  ctx.fillStyle = me ? '#fff0ae' : '#fff7ea'; ctx.fillText(player.name, 0, -84);
  ctx.restore();
}

export function paintArena(canvas: HTMLCanvasElement, state: BattleState, guestId: string) {
  const view = arenaView(canvas, state, guestId);
  if (view.rect.width < 1 || view.rect.height < 1) return;
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const width = Math.round(view.rect.width * dpr), height = Math.round(view.rect.height * dpr);
  if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; }
  const ctx = canvas.getContext('2d'); if (!ctx) return;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, view.rect.width, view.rect.height);
  ctx.fillStyle = '#181723'; ctx.fillRect(0, 0, view.rect.width, view.rect.height);
  ctx.setTransform(dpr * view.scale, 0, 0, dpr * view.scale, -view.x * dpr * view.scale, -view.y * dpr * view.scale);
  const { width: worldWidth, height: worldHeight } = state.arena;
  drawCityMap(ctx, state, view);

  const me = state.players.find(p => p.id === guestId);
  for (const zone of state.arena.hiddenZones) {
    if (zone.x + zone.width < view.x || zone.y + zone.height < view.y ||
      zone.x > view.x + view.rect.width / view.scale || zone.y > view.y + view.rect.height / view.scale) continue;
    const inside = hiddenZoneFor(state, me)?.id === zone.id;
    ctx.save();
    ctx.fillStyle = inside ? '#63c6da24' : '#080b1b32';
    ctx.fillRect(zone.x, zone.y, zone.width, zone.height);
    ctx.strokeStyle = inside ? '#a9f9f1' : '#f9d9a372';
    ctx.lineWidth = inside ? 2.5 : 1.5;
    ctx.setLineDash([6, 5]); ctx.strokeRect(zone.x, zone.y, zone.width, zone.height);
    ctx.setLineDash([]);
    ctx.font = '700 10px system-ui'; ctx.fillStyle = inside ? '#d7ffff' : '#fff0d4';
    ctx.fillText(zone.name, zone.x + 5, zone.y + 15);
    ctx.restore();
  }

  ctx.save();
  ctx.fillStyle = '#31134560';
  ctx.beginPath(); ctx.rect(0, 0, worldWidth, worldHeight);
  ctx.rect(state.zone.x - state.zone.halfWidth, state.zone.y - state.zone.halfHeight, state.zone.halfWidth * 2, state.zone.halfHeight * 2);
  ctx.fill('evenodd');
  ctx.strokeStyle = '#ef9ed3'; ctx.lineWidth = 3; ctx.shadowColor = '#f886d3'; ctx.shadowBlur = 18;
  ctx.strokeRect(state.zone.x - state.zone.halfWidth, state.zone.y - state.zone.halfHeight, state.zone.halfWidth * 2, state.zone.halfHeight * 2);
  ctx.restore();

  drawMagic(ctx, state);
  for (const shot of state.projectiles) drawProjectile(ctx, shot);
  state.players.forEach(p => drawCharacter(ctx, p, p.isBot ? Number(p.id.at(-1)) : 0, p.id === guestId, state));
  for (const hit of state.events.filter(e => e.type === 'damage' && state.time - e.time >= 0 && state.time - e.time < .75)) {
    const target = state.players.find(p => p.id === hit.targetId); if (!target) continue;
    const age = state.time - hit.time, alpha = 1 - age / .75;
    ctx.save(); ctx.globalAlpha = alpha; ctx.textAlign = 'center'; ctx.font = '900 22px system-ui'; ctx.lineWidth = 4;
    const label = `-${Math.round(Number(hit.amount) || 0)}`;
    ctx.strokeStyle = '#2d1823'; ctx.strokeText(label, target.x, target.y - 95 - age * 22);
    ctx.fillStyle = target.id === guestId ? '#ff9a9a' : '#ffe59a'; ctx.fillText(label, target.x, target.y - 95 - age * 22);
    ctx.restore();
  }
}
