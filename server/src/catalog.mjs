// Prototype catalog. Values are deliberately data, not UI rules.
export const cards = [
  ['red_tea', '紅茶', 'base'], ['green_tea', '綠茶', 'base'],
  ['milk', '牛奶', 'dairy'], ['creamer', '奶精', 'dairy'], ['milk_cap', '奶蓋', 'dairy'],
  ['pearl', '珍珠', 'topping'], ['grass_jelly', '仙草', 'topping'],
  ['pudding', '布丁', 'topping'], ['red_bean', '紅豆', 'topping'],
  ['coconut_jelly', '椰果', 'topping'], ['white_pearl', '白玉珍珠', 'topping'],
  ['boba', '波霸', 'topping'], ['mung_bean', '綠豆', 'topping'],
  ['yellow_jelly', '粉粿', 'topping'], ['peanut', '花生', 'topping'],
].map(([id, name, type]) => ({ id, name, type }));

export const cardById = new Map(cards.map(card => [card.id, card]));

// First playable balance pass. Magic values are independent of the card artwork.
export const dairyMagic = {
  milk: { name: '鮮乳光束', cooldown: 12, windup: 0.45, damage: 12, range: 520, halfWidth: 9, healOnHit: 3 },
  creamer: { name: '奶霧爆散', cooldown: 11, windup: 0.35, damage: 10, radius: 95 },
  milk_cap: { name: '奶蓋浪牆', cooldown: 15, windup: 0.2, damage: 13, width: 95, range: 280, speed: 350, push: 12 },
};

export const teaDefense = {
  red_tea: { name: '紅茶茶盾', cooldown: 16, duration: 2.5, absorb: 24 },
  green_tea: { name: '綠茶閃步', cooldown: 14, duration: 0.35, speed: 300 },
};

export const weapons = {
  pearl: { damage: 3, speed: 440, radius: 6, cooldown: 0.18, range: 690 },
  boba: { damage: 10, speed: 340, radius: 11, cooldown: 0.65, range: 600 },
  white_pearl: { damage: 3, speed: 470, radius: 6, cooldown: 0.18, range: 710 },
  grass_jelly: { damage: 10, speed: 390, radius: 8, cooldown: 0.7, range: 540 },
  pudding: { damage: 11, speed: 320, radius: 10, cooldown: 0.85, range: 520 },
  red_bean: { damage: 8, speed: 430, radius: 6, cooldown: 0.55, range: 650 },
  coconut_jelly: { damage: 9, speed: 410, radius: 8, cooldown: 0.6, range: 650 },
  mung_bean: { damage: 7, speed: 490, radius: 5, cooldown: 0.42, range: 700 },
  yellow_jelly: { damage: 9, speed: 380, radius: 8, cooldown: 0.63, range: 610 },
  peanut: { damage: 10, speed: 390, radius: 8, cooldown: 0.65, range: 600 },
};

export { arena } from './arena.mjs';
