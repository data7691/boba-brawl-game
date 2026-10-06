import { useState } from 'react';
import type { BattleState } from '../models/types';

export function BattleMinimap({ state, guestId }: { state: BattleState; guestId: string }) {
  const [expanded, setExpanded] = useState(false);
  const { arena, zone } = state;
  const me = state.players.find(p => p.id === guestId);
  const column = Math.min(8, Math.floor((me?.x || 0) / arena.viewport.width));
  const row = Math.min(8, Math.floor((me?.y || 0) / arena.viewport.height));
  return <button className={`battle-minimap${expanded ? ' expanded' : ''}`}
    aria-label={expanded ? '收起街區地圖' : '展開街區地圖'} onClick={() => setExpanded(!expanded)}>
    <span>9 × 9 街區 · {String.fromCharCode(65 + column)}{row + 1} <small>{expanded ? '收起' : '地圖'}</small></span>
    <svg viewBox={`0 0 ${arena.width} ${arena.height}`} role="img" aria-label="81 格街區、四角出生點與目前安全區">
      <rect width={arena.width} height={arena.height} fill="#191e2c" />
      {arena.obstacles.map((rect, i) => <rect key={`o${i}`} {...rect} fill="#526074" />)}
      {Array.from({ length: 10 }, (_, i) => <g key={i} stroke="#c3c9d84d" strokeWidth={8}>
        <line x1={i * arena.viewport.width} x2={i * arena.viewport.width} y1={0} y2={arena.height} />
        <line x1={0} x2={arena.width} y1={i * arena.viewport.height} y2={i * arena.viewport.height} />
      </g>)}
      <rect x={zone.x - zone.halfWidth} y={zone.y - zone.halfHeight} width={zone.halfWidth * 2}
        height={zone.halfHeight * 2} fill="#f59ed510" stroke="#f4a0d8" strokeWidth={26} />
      <text x={arena.width / 2} y={arena.height / 2 - 120} textAnchor="middle" fontSize={170} fill="#b1ffe9">101</text>
      {arena.spawns.map((point, i) => <circle key={`s${i}`} cx={point.x} cy={point.y} r={55}
        fill="#34454e" stroke="#9dccdf" strokeWidth={12}><title>出生點 {i + 1}</title></circle>)}
      {state.players.filter(p => p.alive && p.id !== guestId).map(p => <circle key={p.id}
        cx={p.x} cy={p.y} r={45} fill="#ff969b" />)}
      {me && <>
        <rect x={Math.max(0, Math.min(arena.width - arena.viewport.width, me.x - arena.viewport.width / 2))}
          y={Math.max(0, Math.min(arena.height - arena.viewport.height, me.y - arena.viewport.height / 2))}
          width={arena.viewport.width} height={arena.viewport.height} fill="#ffdc7b22" stroke="#ffdf88" strokeWidth={14} />
        <circle cx={me.x} cy={me.y} r={60} fill="#ffea93" stroke="#fff" strokeWidth={12} />
      </>}
    </svg>
    {expanded && <small>金色：你的位置　粉色框：安全區　圓環：出生點</small>}
  </button>;
}
