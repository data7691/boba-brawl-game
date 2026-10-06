import { randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const path = process.env.BOBA_DATA_FILE
  ? resolve(process.env.BOBA_DATA_FILE)
  : join(dirname(fileURLToPath(import.meta.url)), '..', 'data', 'prototype.json');
let database = { profiles: [] };
let pending = Promise.resolve();

export async function loadStore() {
  try { database = JSON.parse(await readFile(path, 'utf8')); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  if (!Array.isArray(database.profiles)) database.profiles = [];
}

export function createGuest(name = '珍奶玩家') {
  const guestId = randomUUID();
  const profile = {
    guestId, token: randomUUID(), name: String(name).trim().slice(0, 20) || '珍奶玩家',
    level: 1, exp: 0, coins: 0,
    unlockedCardIds: ['red_tea', 'milk', 'pearl', 'boba'],
    duplicateCounts: {}, drinks: [], equippedDrinkId: null, battleHistory: [],
  };
  database.profiles.push(profile);
  void saveStore();
  return profile;
}

export function profileForToken(token) {
  return database.profiles.find(profile => profile.token === token);
}

export function profileForId(guestId) {
  return database.profiles.find(profile => profile.guestId === guestId);
}

export function publicProfile(profile) {
  const { token, ...safe } = profile;
  return { ...safe, battleHistory: (safe.battleHistory ?? []).map(({ events, ...summary }) => summary) };
}

export function createDrink(profile, { baseId, dairyId = null, toppingIds }) {
  if (!['red_tea', 'green_tea'].includes(baseId)) throw new Error('請選擇紅茶或綠茶');
  if (dairyId !== null && !['milk', 'creamer', 'milk_cap'].includes(dairyId)) throw new Error('乳品不正確');
  if (!Array.isArray(toppingIds) || toppingIds.length < 1 || toppingIds.length > 2 ||
      new Set(toppingIds).size !== toppingIds.length ||
      toppingIds.some(id => !['pearl', 'grass_jelly', 'pudding', 'red_bean', 'coconut_jelly',
        'white_pearl', 'boba', 'mung_bean', 'yellow_jelly', 'peanut'].includes(id))) {
    throw new Error('請選擇 1 至 2 種不同的配料');
  }
  const ingredients = [baseId, dairyId, ...toppingIds].filter(Boolean);
  if (ingredients.some(id => !profile.unlockedCardIds.includes(id))) throw new Error('原料尚未解鎖');
  const drink = { id: randomUUID(), baseId, dairyId, toppingIds, createdAt: new Date().toISOString() };
  profile.drinks.push(drink);
  profile.equippedDrinkId = drink.id;
  void saveStore();
  return drink;
}

export function getEquippedDrink(profile) {
  return profile.drinks.find(drink => drink.id === profile.equippedDrinkId) ??
    { id: 'starter', baseId: 'red_tea', dairyId: 'milk', toppingIds: ['pearl', 'boba'] };
}

export function recordBattle(profile, battle) {
  profile.battleHistory ??= [];
  profile.battleHistory.unshift({
    id: battle.id, completedAt: new Date().toISOString(), status: battle.status,
    winnerId: battle.winnerId, duration: battle.time, events: battle.events,
  });
  profile.battleHistory = profile.battleHistory.slice(0, 10);
  void saveStore();
}

export function saveStore() {
  pending = pending.then(async () => {
    await mkdir(dirname(path), { recursive: true });
    const temp = `${path}.tmp`;
    await writeFile(temp, JSON.stringify(database, null, 2), 'utf8');
    await rename(temp, path);
  });
  return pending;
}
