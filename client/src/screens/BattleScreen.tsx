import { useEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import type { BattleEvent, BattleState } from '../models/types';
import { api } from '../services/api';
import { audioManager } from '../services/AudioManager';
import { hiddenZoneFor, paintArena } from '../game/ArenaRenderer';
import { BattleMinimap } from '../components/BattleMinimap';

const names: Record<string, string> = {
  pearl: '珍珠', white_pearl: '白玉珍珠', boba: '波霸', grass_jelly: '仙草',
  pudding: '布丁', red_bean: '紅豆', coconut_jelly: '椰果', mung_bean: '綠豆',
  yellow_jelly: '粉粿', peanut: '花生',
};
const magicNames: Record<string, string> = { milk: '鮮乳光束', creamer: '奶霧爆散', milk_cap: '奶蓋浪牆' };
const defenseNames: Record<string, string> = { red_tea: '紅茶茶盾', green_tea: '綠茶閃步' };

function playEvent(event: BattleEvent, guestId: string) {
  if (event.type === 'shoot' && event.actorId === guestId) audioManager.play('shoot');
  if (event.type === 'damage') audioManager.play(event.targetId === guestId ? 'hurt' : 'hit');
  if (event.type === 'magic_cast') audioManager.play(event.magicId === 'milk' ? 'magic_beam' :
    event.magicId === 'creamer' ? 'magic_burst' : 'magic_wave');
  if (event.type === 'defense_cast') audioManager.play(event.defenseId === 'red_tea' ? 'defense_shield' : 'defense_dodge');
  if (event.type === 'finish') audioManager.play(event.winnerId === guestId ? 'win' : 'lose');
}

export function BattleScreen({ battleId, initial, guestId, onFinish, onExit }: {
  battleId: string; initial: BattleState; guestId: string;
  onFinish: (state: BattleState) => void; onExit: () => void;
}) {
  const [state, setState] = useState(initial);
  const [error, setError] = useState('');
  const [muted, setMuted] = useState(audioManager.isMuted());
  const stateRef = useRef(initial);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const finishedRef = useRef(false);
  const lastSeq = useRef(initial.events.at(-1)?.seq || 0);
  const magicPending = useRef(false);
  const defensePending = useRef(false);
  const input = useRef({ move: { x: 0, y: 0 }, shoot: false, slot: 0 });
  const keys = useRef(new Set<string>());
  const me = state.players.find(p => p.id === guestId);
  const target = state.players.find(p => p.id === me?.targetId);
  const alive = state.aliveCount ?? state.players.filter(p => p.alive).length;
  const hiding = hiddenZoneFor(state, me);
  const magicId = me?.drink.dairyId;
  const magicCooldown = Math.max(0, me?.magicCooldown || 0);
  const defenseId = me?.drink.baseId;
  const defenseCooldown = Math.max(0, me?.defenseCooldown || 0);

  const castMagic = () => {
    const actor = stateRef.current.players.find(p => p.id === guestId);
    if (!actor?.alive || !actor.drink.dairyId || (actor.magicCooldown || 0) > 0 ||
        (stateRef.current.warmupRemaining || 0) > 0 || magicPending.current) return;
    magicPending.current = true;
    void audioManager.unlock();
    void api.battleMagic(battleId).catch(cause => setError(cause instanceof Error ? cause.message : '魔法施放失敗'))
      .finally(() => { magicPending.current = false; });
  };
  const castDefense = () => {
    const actor = stateRef.current.players.find(p => p.id === guestId);
    if (!actor?.alive || !defenseNames[actor.drink.baseId] || (actor.defenseCooldown || 0) > 0 ||
        (stateRef.current.warmupRemaining || 0) > 0 || defensePending.current) return;
    defensePending.current = true;
    void audioManager.unlock();
    const k = keys.current;
    const x = Number(k.has('d') || k.has('arrowright')) - Number(k.has('a') || k.has('arrowleft'));
    const y = Number(k.has('s') || k.has('arrowdown')) - Number(k.has('w') || k.has('arrowup'));
    const move = x || y ? { x, y } : input.current.move;
    void api.battleDefense(battleId, move).catch(cause => setError(cause instanceof Error ? cause.message : '防禦施放失敗'))
      .finally(() => { defensePending.current = false; });
  };

  useEffect(() => {
    let cancelled = false, polling = false, sending = false;
    const poll = async () => {
      if (polling || cancelled) return;
      polling = true;
      try {
        const result = await api.battleState(battleId);
        if (cancelled) return;
        stateRef.current = result.state;
        setState(result.state);
        for (const event of result.state.events.filter(e => e.seq > lastSeq.current)) playEvent(event, guestId);
        lastSeq.current = result.state.lastEventSeq || result.state.events.at(-1)?.seq || lastSeq.current;
        if (result.state.status === 'finished' && !finishedRef.current) {
          finishedRef.current = true;
          setTimeout(() => { if (!cancelled) onFinish(result.state); }, 1200);
        }
      } catch (cause) {
        if (!cancelled) setError(cause instanceof Error ? cause.message : '對戰連線中斷');
      } finally { polling = false; }
    };
    const send = async () => {
      if (sending || cancelled || stateRef.current.status !== 'playing') return;
      sending = true;
      try {
        const k = keys.current;
        const x = Number(k.has('d') || k.has('arrowright')) - Number(k.has('a') || k.has('arrowleft'));
        const y = Number(k.has('s') || k.has('arrowdown')) - Number(k.has('w') || k.has('arrowup'));
        await api.battleInput(battleId, x || y ? { x, y } : input.current.move,
          input.current.shoot, input.current.slot);
      } catch { /* A later poll shows a connection problem if it persists. */ }
      finally { sending = false; }
    };
    const pollTimer = window.setInterval(() => void poll(), 90);
    const inputTimer = window.setInterval(() => void send(), 65);
    const keyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'q', 'e', 'r', ' '].includes(key)) e.preventDefault();
      keys.current.add(key);
      if (key === 'q' && !e.repeat) {
        const count = stateRef.current.players.find(p => p.id === guestId)?.toppingIds.length || 1;
        input.current.slot = (input.current.slot + 1) % count;
        audioManager.play('switch');
      }
      if (key === ' ') input.current.shoot = true;
      if (key === 'e' && !e.repeat) castMagic();
      if (key === 'r' && !e.repeat) castDefense();
    };
    const keyUp = (e: KeyboardEvent) => {
      keys.current.delete(e.key.toLowerCase());
      if (e.key === ' ') input.current.shoot = false;
    };
    window.addEventListener('keydown', keyDown);
    window.addEventListener('keyup', keyUp);
    void poll();
    return () => {
      cancelled = true;
      clearInterval(pollTimer); clearInterval(inputTimer);
      window.removeEventListener('keydown', keyDown); window.removeEventListener('keyup', keyUp);
    };
  }, [battleId, guestId, onFinish]);

  useEffect(() => {
    let frame = 0;
    const draw = () => {
      if (canvasRef.current) paintArena(canvasRef.current, stateRef.current, guestId);
      frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, [guestId]);

  const moveStick = (e: ReactPointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const dx = e.clientX - (rect.left + rect.width / 2), dy = e.clientY - (rect.top + rect.height / 2);
    const length = Math.max(42, Math.hypot(dx, dy));
    input.current.move = { x: dx / length, y: dy / length };
  };
  const switchSlot = () => {
    const count = me?.toppingIds.length || 1;
    input.current.slot = (input.current.slot + 1) % count;
    audioManager.play('switch');
  };

  return <div className="screen battle-screen city-battle">
    <div className="battle-topbar">
      <div><span className="eyebrow">台北・信義街區</span><strong>{me?.name || '玩家'} · HP {Math.ceil(me?.hp || 0)}/{me?.maxHp || 100}{me?.defense?.type === 'red_tea' ? ` · 茶盾 ${Math.ceil(me.defense.shield || 0)}` : ''}</strong></div>
      <div className="battle-stats"><span>存活 {alive}/4</span><span>{hiding ? `隱蔽中・${hiding.name}` : '街道上'}</span><span>{state.time < state.arena.zoneTiming.start ? `${Math.ceil(state.arena.zoneTiming.start - state.time)} 秒後縮圈` : '安全區收縮中・往中央移動'}</span></div>
      <div className="battle-top-actions"><button aria-label={muted ? '開啟音效' : '靜音'} onClick={() => { audioManager.setMuted(!muted); setMuted(!muted); }}>{muted ? '🔇' : '🔊'}</button><button onClick={() => { void api.battleEnd(battleId); onExit(); }}>離開</button></div>
    </div>
    <div className="arena-wrap">
      <canvas ref={canvasRef} className="battle-canvas"
        onPointerDown={e => { if (e.pointerType === 'mouse') { input.current.shoot = true; e.currentTarget.setPointerCapture(e.pointerId); } }}
        onPointerUp={() => { input.current.shoot = false; }} onPointerCancel={() => { input.current.shoot = false; }} />
      {(state.warmupRemaining || 0) > 0 && <div className="warmup-banner"><small>信義街區・準備交戰</small><strong>{state.warmupRemaining}</strong></div>}
      <BattleMinimap state={state} guestId={guestId} />
      {!me?.alive && <div className="spectator-banner">已淘汰 · 觀戰中</div>}
      {state.status === 'finished' && <div className="spectator-banner">{state.winnerId === guestId ? '最後存活！' : '對戰結束'} · 正在結算</div>}
      {error && <div className="battle-error">{error}</div>}
      <div className="joystick" onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); moveStick(e); }}
        onPointerMove={e => { if (e.buttons) moveStick(e); }}
        onPointerUp={() => { input.current.move = { x: 0, y: 0 }; }} onPointerCancel={() => { input.current.move = { x: 0, y: 0 }; }}><span>移動</span><i /></div>
      <div className="fire-controls"><button className={`defense-button ${defenseId || ''} ${me?.defense ? 'active' : ''}`} disabled={!defenseId || defenseCooldown > 0 || !me?.alive || (state.warmupRemaining || 0) > 0} onClick={castDefense} aria-label={`${defenseId ? defenseNames[defenseId] : '未裝備茶底'}防禦${defenseCooldown > 0 ? `，冷卻 ${Math.ceil(defenseCooldown)} 秒` : ''}`}><strong>{defenseCooldown > 0 ? `${Math.ceil(defenseCooldown)}s` : '防禦'}</strong><small>{defenseId ? defenseNames[defenseId] : '無茶底'}</small></button><button className={`magic-button ${magicId || 'empty'}`} disabled={!magicId || magicCooldown > 0 || !me?.alive || me?.defense?.type === 'green_tea' || (state.warmupRemaining || 0) > 0} onClick={castMagic} aria-label={`${magicId ? magicNames[magicId] : '未裝備乳品'}魔法${magicCooldown > 0 ? `，冷卻 ${Math.ceil(magicCooldown)} 秒` : ''}`}><strong>{magicCooldown > 0 ? `${Math.ceil(magicCooldown)}s` : '魔法'}</strong><small>{magicId ? magicNames[magicId] : '未裝備'}</small></button><button className="switch-button" disabled={(me?.toppingIds.length || 0) < 2} onClick={switchSlot}>切換<br />{names[me?.toppingIds[(input.current.slot + 1) % (me?.toppingIds.length || 1)] || ''] || '配料'}</button>
        <div className="fire-pad" onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); input.current.shoot = true; }}
          onPointerUp={() => { input.current.shoot = false; }}
          onPointerCancel={() => { input.current.shoot = false; }}><strong>發射</strong><small>自動瞄準</small></div></div>
      <div className="weapon-pill">吸管彈藥：{names[me?.toppingIds[me?.slot || 0] || ''] || '珍珠'} · {target ? `鎖定 ${target.name}` : '尋找目標'}{(me?.cooldown || 0) > 0 ? ` · ${me!.cooldown!.toFixed(1)}s` : ''}</div>
    </div>
    <div className="battle-footer"><span>發射連射 · 防禦 R · 魔法 E · 街角可躲藏</span><div className="battle-event-feed">{state.events.slice(-2).map(e => <span key={e.seq}>{e.text}</span>)}</div></div>
  </div>;
}
