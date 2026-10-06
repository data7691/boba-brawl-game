# 單機 Web 音效模組（試玩版）

`client/src/services/AudioManager.ts` 匯出 `audioManager` 和 `AudioManager`；
`client/src/utils/SoundSynthesizer.ts` 以 Web Audio 即時合成短音效，不依賴外部音檔。

在開始遊戲按鈕的 `click`／觸控事件內，**先直接呼叫** `audioManager.unlock()`，
不要先 `await` 其他非音訊工作；這樣 iPhone Safari 才有機會解鎖聲音。
若 `unlock()` 回傳 `false`，遊戲仍可無聲運作。

```ts
import { audioManager } from "./services/AudioManager";

startButton.addEventListener("click", async () => {
  const audible = await audioManager.unlock();
  if (audible) audioManager.play("ui");
  startGame();
});

audioManager.play("shoot"); // 依遊戲事件呼叫
audioManager.setMuted(true); // 靜音按鈕
```

可用 cue：`ui`（按鈕）、`switch`（切換配料）、`pickup`（取得物品）、
`shoot`（發射）、`hit`（命中）、`hurt`（受傷）、`craft`（飲料合成）、
`win`（勝利）、`lose`（失敗）。另有 `setVolume(0..1)`、`isMuted()`、`dispose()`。

這是單機操作回饋音；多人正式版應由已確認的遊戲事件觸發，音效本身不決定戰鬥結果。
