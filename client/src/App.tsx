import { useCallback, useEffect, useState } from 'react';
import type { BattleState, Card, Profile } from './models/types';
import { api } from './services/api';
import { audioManager } from './services/AudioManager';
import { HomeScreen } from './screens/HomeScreen';
import { DrawScreen } from './screens/DrawScreen';
import { LoadoutScreen } from './screens/LoadoutScreen';
import { BattleScreen } from './screens/BattleScreen';
import { ResultsScreen } from './screens/ResultsScreen';

type Page='home'|'draw'|'loadout'|'battle'|'results';

export default function App(){
  const [page,setPage]=useState<Page>('home'),[profile,setProfile]=useState<Profile|null>(null),[cards,setCards]=useState<Card[]>([]);
  const [battle,setBattle]=useState<{id:string;state:BattleState}|null>(null),[result,setResult]=useState<BattleState|null>(null);
  const [busy,setBusy]=useState(false),[error,setError]=useState('');
  useEffect(()=>{let live=true;(async()=>{try{
    const p=await api.enter();const c=await api.cards();if(live){setProfile(p);setCards(c.cards)}
  }catch(e){if(live)setError(e instanceof Error?e.message:'無法啟動遊戲')}})();return()=>{live=false}},[]);
  const startBattle=useCallback(async()=>{
    void audioManager.unlock();audioManager.play('ui');setBusy(true);setError('');
    try{const started=await api.battleStart();setBattle({id:started.battleId,state:started.state});setResult(null);setPage('battle')}
    catch(e){setError(e instanceof Error?e.message:'無法開始對戰')}
    finally{setBusy(false)}
  },[]);
  const finishBattle=useCallback(async(state:BattleState)=>{
    let complete=state;
    if(battle){try{const log=await api.battleLog(battle.id);complete={...state,events:log.events}}catch{}}
    setResult(complete);setPage('results');
    try{const latest=await api.profile();setProfile(latest.profile)}catch{}
  },[battle]);
  const exitBattle=useCallback(()=>{setBattle(null);setPage('home')},[]);
  if(!profile||!cards.length)return <div className="boot-screen"><div className="boot-mark">🧋</div><h1>珍奶大亂鬥</h1><p>{error||'正在連接本機遊戲服務…'}</p>{error&&<button className="primary-button" onClick={()=>location.reload()}>重新連接</button>}</div>;
  return <div className="app-shell"><header className="app-header"><button className="brand" disabled={page==='battle'} onClick={()=>setPage('home')}><span>🧋</span><strong>BOBA BRAWL</strong></button><nav><button disabled={page==='battle'} className={page==='home'?'active':''} onClick={()=>setPage('home')}>大廳</button><button disabled={page==='battle'} className={page==='draw'?'active':''} onClick={()=>setPage('draw')}>抽卡</button><button disabled={page==='battle'} className={page==='loadout'?'active':''} onClick={()=>setPage('loadout')}>整備</button></nav><div className="profile-pill">{profile.name} <span>Lv.{profile.level}</span></div></header>
    {page==='home'&&<HomeScreen profile={profile} cards={cards} onDraw={()=>{audioManager.play('ui');setPage('draw')}} onLoadout={()=>{audioManager.play('ui');setPage('loadout')}} onBattle={()=>void startBattle()} busy={busy}/>}
    {page==='draw'&&<DrawScreen cards={cards} onProfile={setProfile} onBack={()=>setPage('home')}/>}
    {page==='loadout'&&<LoadoutScreen cards={cards} profile={profile} onProfile={setProfile} onBack={()=>setPage('home')} onBattle={()=>void startBattle()}/>}
    {page==='battle'&&battle&&<BattleScreen battleId={battle.id} initial={battle.state} guestId={profile.guestId} onFinish={finishBattle} onExit={exitBattle}/>}
    {page==='results'&&result&&<ResultsScreen state={result} guestId={profile.guestId} onRematch={()=>void startBattle()} onHome={()=>setPage('home')}/>}
    {error&&<div className="toast" role="alert">{error}<button onClick={()=>setError('')}>×</button></div>}
  </div>;
}
