import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { randomInt } from 'node:crypto';
import { cards } from './catalog.mjs';
import { createGuest, loadStore, profileForToken, profileForId, publicProfile, createDrink, recordBattle, saveStore } from './store.mjs';
import { createBattle, publicState, requestDefense, requestMagic, submitInput, tick } from './engine.mjs';

const port = Number(process.env.PORT ?? 4180);
const host = process.env.HOST ?? '127.0.0.1';
const __dirname = dirname(fileURLToPath(import.meta.url));
const clientDist = resolve(__dirname, '../../client/dist');
const clientPublic = resolve(__dirname, '../../client/public');
const battles = new Map();

function json(response, code, data) {
  const content = JSON.stringify(data);
  response.writeHead(code, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(content),
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  });
  response.end(content);
}

async function bodyOf(request) {
  let body = '';
  for await (const part of request) {
    body += part;
    if (body.length > 16_384) throw new Error('請求過大');
  }
  if (!body) return {};
  try { return JSON.parse(body); }
  catch { throw new Error('JSON 格式不正確'); }
}

function battleFor(url, body, profile) {
  const id = body.battleId ?? url.searchParams.get('battleId');
  const battle = battles.get(id);
  if (!battle || battle.ownerId !== profile.guestId) throw new Error('找不到這場對戰');
  return battle;
}

async function api(request, response, url) {
  if (request.method === 'OPTIONS') return json(response, 204, {});
  if (url.pathname === '/api/health') return json(response, 200, { ok: true, mode: 'local-prototype' });
  if (url.pathname === '/api/guest' && request.method === 'POST') {
    const body = await bodyOf(request);
    const profile = createGuest(body.name);
    return json(response, 200, { guestId: profile.guestId, token: profile.token, profile: publicProfile(profile) });
  }
  const token = request.headers.authorization?.match(/^Bearer (.+)$/)?.[1];
  const profile = token && profileForToken(token);
  if (!profile) return json(response, 401, { error: '請先建立訪客身分' });
  if (url.pathname === '/api/profile' && request.method === 'GET') return json(response, 200, { profile: publicProfile(profile) });
  if (url.pathname === '/api/battles' && request.method === 'GET')
    return json(response, 200, { battles: (profile.battleHistory ?? []).map(({ events, ...battle }) => battle) });
  if (url.pathname === '/api/cards' && request.method === 'GET') return json(response, 200, { cards });
  if (url.pathname === '/api/draw' && request.method === 'POST') {
    // Prototype-only free draw; no production probabilities or payment model.
    const unseen = cards.filter(card => !profile.unlockedCardIds.includes(card.id));
    const pool = unseen.length ? unseen : cards;
    const card = pool[randomInt(pool.length)];
    if (unseen.length) profile.unlockedCardIds.push(card.id);
    else profile.duplicateCounts[card.id] = (profile.duplicateCounts[card.id] ?? 0) + 1;
    await saveStore();
    return json(response, 200, { card, isDuplicate: unseen.length === 0, profile: publicProfile(profile) });
  }
  if (url.pathname === '/api/craft' && request.method === 'POST') {
    const drink = createDrink(profile, await bodyOf(request));
    await saveStore();
    return json(response, 200, { drink, profile: publicProfile(profile) });
  }
  if (url.pathname === '/api/equip' && request.method === 'POST') {
    const { drinkId } = await bodyOf(request);
    if (!profile.drinks.some(drink => drink.id === drinkId)) throw new Error('飲料不存在或不屬於你');
    profile.equippedDrinkId = drinkId;
    await saveStore();
    return json(response, 200, { profile: publicProfile(profile) });
  }
  if (url.pathname === '/api/battle/start' && request.method === 'POST') {
    for (const [id, battle] of battles) if (battle.ownerId === profile.guestId && battle.status === 'playing') battles.delete(id);
    const battle = createBattle(profile);
    battles.set(battle.id, battle);
    return json(response, 200, { battleId: battle.id, state: publicState(battle) });
  }
  if (url.pathname === '/api/battle/input' && request.method === 'POST') {
    const body = await bodyOf(request);
    const battle = battleFor(url, body, profile);
    submitInput(battle, profile, body);
    return json(response, 200, { ok: true });
  }
  if (url.pathname === '/api/battle/magic' && request.method === 'POST') {
    const body = await bodyOf(request);
    const battle = battleFor(url, body, profile);
    return json(response, 200, { cast: requestMagic(battle, profile) });
  }
  if (url.pathname === '/api/battle/defense' && request.method === 'POST') {
    const body = await bodyOf(request);
    const battle = battleFor(url, body, profile);
    return json(response, 200, { activated: requestDefense(battle, profile, body.move) });
  }
  if (url.pathname === '/api/battle/state' && request.method === 'GET') {
    const battle = battleFor(url, {}, profile);
    return json(response, 200, { state: publicState(battle) });
  }
  if (url.pathname === '/api/battle/log' && request.method === 'GET') {
    const id = url.searchParams.get('battleId');
    const battle = battles.get(id);
    if (battle?.ownerId === profile.guestId)
      return json(response, 200, { events: battle.events, status: battle.status, winnerId: battle.winnerId });
    const old = (profile.battleHistory ?? []).find(item => item.id === id);
    if (old) return json(response, 200, { events: old.events, status: old.status, winnerId: old.winnerId });
    throw new Error('找不到這場對戰');
  }
  if (url.pathname === '/api/battle/end' && request.method === 'POST') {
    const body = await bodyOf(request);
    const battle = battleFor(url, body, profile);
    if (battle.status === 'playing') {
      battle.status = 'abandoned';
      battle.winnerId = null;
      battle.events.push({ seq: ++battle.eventSeq, time: battle.time, type: 'abandon', text: '玩家離開對戰' });
    }
    return json(response, 200, { state: publicState(battle) });
  }
  return json(response, 404, { error: 'API 不存在' });
}

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.mp3': 'audio/mpeg' };

async function serveStatic(request, response, url) {
  let pathname;
  try { pathname = decodeURIComponent(url.pathname); } catch { response.writeHead(400); return response.end(); }
  if (pathname.includes('..') || pathname.includes('\\')) { response.writeHead(403); return response.end(); }
  const distExists = await stat(clientDist).then(s => s.isDirectory()).catch(() => false);
  const root = distExists ? clientDist : clientPublic;
  const candidate = resolve(root, `.${pathname === '/' ? '/index.html' : pathname}`);
  if (candidate !== root && !candidate.startsWith(`${root}${sep}`)) { response.writeHead(403); return response.end(); }
  let path = candidate;
  let file;
  try { file = await readFile(path); }
  catch {
    if (distExists && !extname(pathname)) {
      path = join(root, 'index.html');
      try { file = await readFile(path); } catch { response.writeHead(404); return response.end(); }
    } else { response.writeHead(404); return response.end(); }
  }
  response.writeHead(200, { 'Content-Type': MIME[extname(path)] ?? 'application/octet-stream',
    'Cache-Control': path.endsWith('index.html') ? 'no-cache' : 'public, max-age=3600' });
  response.end(file);
}

await loadStore();
const server = http.createServer(async (request, response) => {
  const url = new URL(request.url, `http://${request.headers.host ?? 'localhost'}`);
  try {
    if (url.pathname.startsWith('/api/')) await api(request, response, url);
    else await serveStatic(request, response, url);
  } catch (error) {
    json(response, 400, { error: error.message ?? '請求無法處理' });
  }
});

setInterval(() => {
  const now = Date.now();
  for (const [id, battle] of battles) {
    if (battle.status === 'playing') tick(battle, (now - battle.lastTick) / 1000);
    battle.lastTick = now;
    if (battle.status !== 'playing' && !battle.recorded) {
      battle.recorded = true;
      const profile = profileForId(battle.ownerId);
      if (profile) recordBattle(profile, battle);
    }
    if (battle.status !== 'playing' && now - (battle.endedAt ?? (battle.endedAt = now)) > 30 * 60_000) battles.delete(id);
  }
}, 50).unref();

server.listen(port, host, () => console.log(`Boba Brawl local server: http://${host}:${port}`));
