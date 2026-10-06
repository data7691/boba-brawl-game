import type { Card, Profile } from '../models/types';
import { CardArt } from '../components/CardArt';
import { DrinkCup } from '../components/DrinkCup';

export function HomeScreen({ profile, cards, onDraw, onLoadout, onBattle, busy }: {
  profile: Profile; cards: Card[]; onDraw: () => void; onLoadout: () => void; onBattle: () => void; busy: boolean;
}) {
  const equipped = profile.drinks.find(x => x.id === profile.equippedDrinkId) || null;
  const name = (id: string) => cards.find(x => x.id === id)?.name || id;
  return <div className="screen home-screen">
    <div className="hero-panel">
      <div className="hero-copy">
        <div className="eyebrow">BOBA BRAWL · 單機試玩</div>
        <h1>珍奶大亂鬥</h1>
        <p>抽原料、做手搖飲，拿起吸管射出你的招牌配料。在信義街區的街道與暗巷裡成為最後存活的人。</p>
        <div className="hero-buttons">
          <button className="primary-button" onClick={onBattle} disabled={busy}>進入信義街區</button>
          <button className="secondary-button" onClick={onLoadout}>整備飲料</button>
        </div>
      </div>
      <div className="hero-drink"><DrinkCup drink={equipped || { baseId:'red_tea',dairyId:'milk',toppingIds:['pearl'] }} /></div>
    </div>
    <div className="home-side">
      <div className="info-panel"><span className="eyebrow">玩家資料</span><strong>{profile.name}</strong><small>Lv.{profile.level} · EXP {profile.exp} · 金幣 {profile.coins}</small></div>
      <div className="info-panel"><span className="eyebrow">目前裝備</span><strong>{equipped ? [name(equipped.toppingIds[0]),equipped.toppingIds[1] && name(equipped.toppingIds[1]),equipped.dairyId && name(equipped.dairyId),name(equipped.baseId)].filter(Boolean).join('・') : '預設珍珠鮮奶茶'}</strong><small>{equipped ? `${name(equipped.baseId)}防禦${equipped.dairyId ? `・${name(equipped.dairyId)}魔法` : ''}可在對戰中施放` : '紅茶防禦・牛奶魔法可在對戰中施放'}</small></div>
      <button className="draw-teaser" onClick={onDraw}><CardArt card={cards.find(x=>x.id==='pearl') || {id:'pearl',name:'珍珠',type:'topping'}} small /><span><strong>抽原料卡</strong><small>免費測試抽卡 · 已解鎖 {profile.unlockedCardIds.length}/{cards.length}</small></span><span className="arrow">›</span></button>
    </div>
  </div>;
}
