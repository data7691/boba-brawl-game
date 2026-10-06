export type CardKind = 'base' | 'dairy' | 'topping';

export interface Card { id: string; name: string; type: CardKind }
export interface Drink { id: string; baseId: string; dairyId: string | null; toppingIds: string[]; createdAt: string }
export interface Profile {
  guestId: string; name: string; level: number; exp: number; coins: number;
  unlockedCardIds: string[]; duplicateCounts: Record<string, number>;
  drinks: Drink[]; equippedDrinkId: string | null;
}
export interface BattleEvent { seq: number; time: number; type: string; text: string; [key: string]: unknown }
export interface BattlePlayer {
  id: string; name: string; isBot: boolean; x: number; y: number; angle: number; facing: number; targetId: string | null;
  hp: number; maxHp: number; alive: boolean; moving?: boolean; blowing?: boolean; slot: number; toppingIds: string[];
  cooldown?: number; magicCooldown?: number; defenseCooldown?: number;
  defense?: { type: 'red_tea' | 'green_tea'; remaining: number; shield?: number; direction?: { x: number; y: number } } | null;
  drink: Pick<Drink, 'baseId' | 'dairyId' | 'toppingIds'>;
}
export interface BattleState {
  id: string; status: 'playing' | 'finished'; time: number;
  arena: { width: number; height: number; tileSize: number; viewport: { width: number; height: number };
    screens: { columns: number; rows: number }; spawns: { x: number; y: number }[];
    zoneTiming: { start: number; finalArea: number; collapse: number; limit: number };
    projectileOrigin: { forward: number; height: number; mouthSide: number; blowLean: number }; obstacles: { x: number; y: number; width: number; height: number }[];
    hiddenZones: { id: string; name: string; x: number; y: number; width: number; height: number }[] };
  zone: { x: number; y: number; halfWidth: number; halfHeight: number; shape: 'rectangle' };
  players: BattlePlayer[];
  projectiles: { id: string; ownerId: string; x: number; y: number; angle: number; radius: number; toppingId: string }[];
  magicEffects: { id: string; type: string; ownerId: string; x: number; y: number; aimX: number; aimY: number;
    age: number; phase: 'windup' | 'active'; traveled: number; length?: number; frontX?: number; frontY?: number }[];
  winnerId: string | null;
  events: BattleEvent[];
  lastEventSeq?: number;
  aliveCount?: number;
  warmupRemaining?: number;
}
export interface Credentials { guestId: string; token: string }
