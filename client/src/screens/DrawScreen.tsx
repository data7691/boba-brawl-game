import { useState } from 'react';
import { CardArt } from '../components/CardArt';
import type { Card, Profile } from '../models/types';
import { api } from '../services/api';
import { audioManager } from '../services/AudioManager';

export function DrawScreen({ cards, onProfile, onBack }: { cards: Card[]; onProfile: (p: Profile) => void; onBack: () => void }) {
  const [results,setResults] = useState<{card:Card;duplicate:boolean}[]>([]);
  const [busy,setBusy] = useState(false);
  const [message,setMessage] = useState('抽出的原料永久解鎖；此處沒有正式機率或付費。');
  const draw = async (count: number) => {
    if (busy) return;
    void audioManager.unlock(); audioManager.play('ui'); setBusy(true);setResults([]);setMessage('卡片正在翻開…');
    try {
      const next: {card:Card;duplicate:boolean}[] = [];
      for (let i=0;i<count;i++) {
        const result = await api.draw();
        next.push({card:result.card,duplicate:result.isDuplicate});onProfile(result.profile);
      }
      setResults(next);audioManager.play('pickup');setMessage(count===1?'抽卡完成':'十連抽完成');
    } catch (error) { setMessage(error instanceof Error?error.message:'抽卡失敗'); }
    finally { setBusy(false); }
  };
  return <div className="screen draw-screen">
    <div className="screen-heading"><button className="back-button" onClick={onBack}>‹ 返回大廳</button><div><span className="eyebrow">原料收藏</span><h1>抽卡室</h1></div><span className="hint">測試抽卡不設定稀有度機率</span></div>
    <div className="draw-layout"><div className="draw-stage">
      <div className="draw-glow" />
      <div className={`draw-results ${results.length>1?'ten':''}`}>
        {results.length ? results.map((result,i)=><div className="draw-card revealed" key={`${i}-${result.card.id}`} style={{animationDelay:`${i*65}ms`}}><CardArt card={result.card} /><strong>{result.card.name}</strong><small>{result.duplicate?'重複取得':'新原料解鎖'}</small></div>) : <div className="draw-card card-back"><img src="/assets/cards/concepts/card-back-blue.png" alt="尚未翻開的卡背" /></div>}
      </div>
      <p className="draw-message" role="status">{message}</p>
    </div><div className="draw-actions">
      <h2>取得新的配料</h2><p>用抽到的原料製作飲料，進入對戰後用吸管射出配料。重複卡暫時只記錄，經濟規則之後再定。</p>
      <button className="primary-button" disabled={busy} onClick={()=>void draw(1)}>抽 1 張</button>
      <button className="secondary-button" disabled={busy} onClick={()=>void draw(10)}>十連抽</button>
      <button className="text-button" onClick={onBack}>前往整備請回大廳選擇</button>
    </div></div>
    <div className="collection-strip">{cards.map(card=><CardArt key={card.id} card={card} small />)}</div>
  </div>;
}
