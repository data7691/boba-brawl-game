import type { BattleState } from '../models/types';

export function ResultsScreen({state,guestId,onRematch,onHome}: {state:BattleState;guestId:string;onRematch:()=>void;onHome:()=>void}) {
  const eliminated=new Map(state.events.filter(e=>e.type==='elimination').map(e=>[String(e.targetId),e.seq]));
  const players=[...state.players].sort((a,b)=>Number(b.alive)-Number(a.alive)||((eliminated.get(b.id)||0)-(eliminated.get(a.id)||0))||b.hp-a.hp);
  const victory=state.winnerId===guestId;
  const draw=state.winnerId===null;
  const allOut=state.players.every(p=>!p.alive);
  return <div className="screen results-screen"><div className="result-banner"><span className="eyebrow">信義街區 · 試玩結果</span><h1>{victory?'最後存活・勝利':draw?(allOut?'全員淘汰・平手':'時間到・平手'):'本局結束'}</h1><p>{victory?'漂亮的一杯！你的配料擊敗了其他對手。':draw?(allOut?'這次沒有人存活；換一種走位或配料再試一次。':'時間到時有多名角色並列；下一場試著主動追擊。'):'再調整配料組合，下一場試試不同的射程與手感。'}</p><div className="result-actions"><button className="primary-button" onClick={onRematch}>再戰一場</button><button className="secondary-button" onClick={onHome}>返回大廳</button></div></div>
    <div className="result-details"><h2>參戰角色</h2>{players.map((p,i)=><div className={`rank-row ${p.id===guestId?'me':''}`} key={p.id}><strong>#{i+1} {p.name}</strong><span>{p.alive?'存活': '淘汰'}</span><span>HP {Math.round(p.hp)}</span></div>)}<h2>戰鬥紀錄</h2><div className="battle-log">{state.events.slice(-50).reverse().map((e,i)=><p key={`${e.seq}-${i}`}>{e.text}</p>)}</div></div>
  </div>;
}
