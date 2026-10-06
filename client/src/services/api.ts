import type { BattleEvent, BattleState, Card, Credentials, Drink, Profile } from '../models/types';

const SESSION_KEY = 'boba-brawl-guest-session';
let credentials: Credentials | null = null;

try { credentials = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null') as Credentials | null; } catch { credentials = null; }

async function request<T>(path: string, body?: unknown): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`/api${path}`, {
      method: body === undefined ? 'GET' : 'POST',
      headers: {
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
        ...(credentials ? { Authorization: `Bearer ${credentials.token}` } : {})
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) })
    });
  } catch {
    throw new Error('無法連線到本機遊戲服務。請先啟動專案，再重新整理。');
  }
  const data = await response.json().catch(() => ({})) as Record<string, unknown>;
  if (!response.ok) throw new Error(String(data.error || data.message || `服務錯誤 ${response.status}`));
  return data as T;
}

export const api = {
  async enter(name = '珍奶玩家'): Promise<Profile> {
    if (!credentials) {
      const result = await request<{ guestId: string; token: string; profile: Profile }>('/guest', { name });
      credentials = { guestId: result.guestId, token: result.token };
      localStorage.setItem(SESSION_KEY, JSON.stringify(credentials));
      return result.profile;
    }
    try { return (await request<{ profile: Profile }>('/profile')).profile; }
    catch {
      credentials = null; localStorage.removeItem(SESSION_KEY);
      return api.enter(name);
    }
  },
  cards: () => request<{ cards: Card[] }>('/cards'),
  profile: () => request<{ profile: Profile }>('/profile'),
  draw: () => request<{ card: Card; isDuplicate: boolean; profile: Profile }>('/draw', {}),
  craft: (baseId: string, dairyId: string | null, toppingIds: string[]) =>
    request<{ drink: Drink; profile: Profile }>('/craft', { baseId, dairyId, toppingIds }),
  equip: (drinkId: string) => request<{ profile: Profile }>('/equip', { drinkId }),
  battleStart: () => request<{ battleId: string; state: BattleState }>('/battle/start', {}),
  battleInput: (battleId: string, move: { x: number; y: number }, shoot: boolean, slot: number) =>
    request<{ ok: true }>('/battle/input', { battleId, move, shoot, slot }),
  battleMagic: (battleId: string) => request<{ cast: boolean }>('/battle/magic', { battleId }),
  battleDefense: (battleId: string, move: { x: number; y: number }) =>
    request<{ activated: boolean }>('/battle/defense', { battleId, move }),
  battleState: (battleId: string) => request<{ state: BattleState }>(`/battle/state?battleId=${encodeURIComponent(battleId)}`),
  battleLog: (battleId: string) => request<{ events: BattleEvent[] }>(`/battle/log?battleId=${encodeURIComponent(battleId)}`),
  battleEnd: (battleId: string) => request<{ state: BattleState }>('/battle/end', { battleId })
};
