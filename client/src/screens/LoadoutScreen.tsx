import { useEffect, useState } from 'react';
import { CardArt } from '../components/CardArt';
import { DrinkCup } from '../components/DrinkCup';
import type { Card, Profile } from '../models/types';
import { api } from '../services/api';
import { audioManager } from '../services/AudioManager';

const magicDescription: Record<string, string> = {
  milk: '鮮乳光束：直線遠距攻擊，命中少量回血。',
  creamer: '奶霧爆散：近身範圍攻擊，可同時擊中多人。',
  milk_cap: '奶蓋浪牆：向前推出泡沫浪，傷害並輕推敵人。',
};
const defenseDescription: Record<string, string> = {
  red_tea: '紅茶茶盾：短時間吸收最多 24 點攻擊傷害。',
  green_tea: '綠茶閃步：沿移動方向衝刺，短暫閃避攻擊。',
};

export function LoadoutScreen({ cards, profile, onProfile, onBack, onBattle }: {
  cards: Card[]; profile: Profile; onProfile: (p: Profile) => void; onBack: () => void; onBattle: () => void;
}) {
  const unlocked = new Set(profile.unlockedCardIds);
  const first = (type: Card['type']) => cards.find(x=>x.type===type && unlocked.has(x.id))?.id || null;
  const equipped = profile.drinks.find(drink => drink.id === profile.equippedDrinkId);
  const [base,setBase] = useState<string>(equipped?.baseId || first('base') || 'red_tea');
  const [dairy,setDairy] = useState<string|null>(equipped ? equipped.dairyId : first('dairy'));
  const [toppings,setToppings] = useState<string[]>(equipped?.toppingIds || (first('topping')?[first('topping')!]:[]));
  const [busy,setBusy] = useState(false);
  const [message,setMessage] = useState('選好材料後製作，原料卡不會被消耗。');
  const [crafting,setCrafting] = useState(false);
  const name = (id: string) => cards.find(x=>x.id===id)?.name || id;
  useEffect(()=>{if(!unlocked.has(base))setBase(first('base')||'red_tea')},[profile.unlockedCardIds.join(',')]);
  const toggleTopping = (id:string) => setToppings(previous=>previous.includes(id)?previous.filter(x=>x!==id):previous.length<2?[...previous,id]:[previous[1],id]);
  const craft = async () => {
    if(busy || !toppings.length)return;
    void audioManager.unlock();audioManager.play('ui');setBusy(true);setCrafting(true);setMessage('正在搖製飲料…');
    try {
      const result=await api.craft(base,dairy,toppings);onProfile(result.profile);
      const equipped=await api.equip(result.drink.id);onProfile(equipped.profile);
      audioManager.play('craft');setMessage(toppings.length === 2
        ? '調製完成，已裝備！進場後可切換兩種配料。'
        : `調製完成，已裝備！進場後可用吸管發射${name(toppings[0])}。`);
    } catch(error) {setMessage(error instanceof Error?error.message:'合成失敗');}
    finally {setBusy(false);setTimeout(()=>setCrafting(false),800);}
  };
  return <div className="screen loadout-screen">
    <div className="screen-heading"><button className="back-button" onClick={onBack}>‹ 返回大廳</button><div><span className="eyebrow">戰前整備</span><h1>手搖飲工坊</h1></div><button className="small-action" onClick={onBattle}>進入對戰 ›</button></div>
    <div className="loadout-layout"><div className="ingredient-panel">
      {(['base','dairy','topping'] as const).map(type=><div className="ingredient-group" key={type}>
        <div className="group-heading"><h2>{type==='base'?'茶底防禦':type==='dairy'?'乳品魔法':'配料彈藥'}</h2><small>{type==='base'?'選 1 種防禦技能':type==='dairy'?'選 1 種可施放魔法，也可不加':'選 1～2 種，可在戰鬥中切換'}</small></div>
        <div className="ingredient-grid">{cards.filter(x=>x.type===type).map(card=>{
          const owned=unlocked.has(card.id),selected=type==='base'?base===card.id:type==='dairy'?dairy===card.id:toppings.includes(card.id);
          return <button key={card.id} className={`ingredient-choice ${selected?'selected':''} ${owned?'':'locked'}`} disabled={!owned||busy} onClick={()=>{audioManager.play('ui');type==='base'?setBase(card.id):type==='dairy'?setDairy(dairy===card.id?null:card.id):toggleTopping(card.id)}}>
            <CardArt card={card} small /><span>{card.name}</span>{!owned&&<em>未解鎖</em>}
          </button>;
        })}</div>
      </div>)}
    </div><div className="mix-panel">
      <div className="mix-art"><div className="mix-rays" /><DrinkCup className={crafting?'crafting':''} drink={{baseId:base,dairyId:dairy,toppingIds:toppings}} /></div>
      <div className="mix-info"><span className="eyebrow">本次配方</span><h2>{[...toppings.map(name),dairy?name(dairy):'',name(base)].filter(Boolean).join('・')}</h2><p>{toppings.length===2?`${name(toppings[0])}／${name(toppings[1])} 可在戰鬥中切換`:'再選一種配料，可增加戰鬥中的攻擊選擇。'}</p><p className="magic-description">{defenseDescription[base]}</p><p className="magic-description">{dairy ? magicDescription[dairy] : '未加乳品：本杯沒有魔法技能。'}</p>
        <button className="primary-button" disabled={busy||!toppings.length} onClick={()=>void craft()}>{busy?'調製中…':'製作並裝備'}</button>
        <p className="inline-message" role="status">{message}</p>
      </div>
      <div className="saved-drinks"><span className="eyebrow">已製作飲料</span>{profile.drinks.slice().reverse().map(drink=><button key={drink.id} className={profile.equippedDrinkId===drink.id?'active':''} onClick={async()=>{try{const result=await api.equip(drink.id);onProfile(result.profile);setBase(drink.baseId);setDairy(drink.dairyId);setToppings(drink.toppingIds);audioManager.play('switch');setMessage('已裝備這杯飲料。')}catch(error){setMessage(error instanceof Error?error.message:'裝備失敗')}}}>{[...drink.toppingIds.map(name),drink.dairyId&&name(drink.dairyId),name(drink.baseId)].filter(Boolean).join('・')}{profile.equippedDrinkId===drink.id?' ✓':''}</button>)}</div>
    </div></div>
  </div>;
}
