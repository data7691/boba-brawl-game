# 本機單機 Web 對戰原型

此目錄提供獨立於畫面的 Node.js 伺服器。需要 Node 20 以上；不需安裝第三方套件。於專案根目錄執行：

```powershell
node server/src/index.mjs
```

預設網址為 `http://127.0.0.1:4180`。伺服器會優先提供 `client/dist` 編譯後的網站；若尚未編譯，則提供 `client/public` 靜態檔。亦可用 `PORT`、`HOST` 環境變數調整。若要在手機測試，另須在可信任的本機網路與 HTTPS 環境中開放服務。

## API

除訪客建立和健康檢查外，所有端點需 `Authorization: Bearer <token>`。資料格式皆為 JSON。

| Method | Path | Body／回應摘要 |
| --- | --- | --- |
| POST | `/api/guest` | `{name?}` → `{guestId,token,profile}` |
| GET | `/api/profile` | `{profile}` |
| GET | `/api/cards` | `{cards:[{id,name,type}]}` |
| POST | `/api/draw` | 免費測試抽卡 → `{card,isDuplicate,profile}` |
| POST | `/api/craft` | `{baseId,dairyId?,toppingIds:[一或兩種]}` → `{drink,profile}` |
| POST | `/api/equip` | `{drinkId}` → `{profile}` |
| POST | `/api/battle/start` | `{}` → `{battleId,state}`；啟動 1 真人＋3 電腦沙漠房間 |
| POST | `/api/battle/input` | `{battleId,move:{x,y},aim:{x,y},shoot:boolean,slot:0或1}` → `{ok:true}` |
| GET | `/api/battle/state?battleId=…` | `{state}`；建議畫面每 100 ms 擷取一次 |
| GET | `/api/battle/log?battleId=…` | 完整 `{events,status,winnerId}` |
| POST | `/api/battle/end` | `{battleId}`；玩家離場，**無法指定勝者** |
| GET | `/api/battles` | 最近 10 場結束的對戰摘要 |
| GET | `/api/health` | `{ok:true,mode:'local-prototype'}` |

對戰狀態的 `arena` 是 `900×520`；`players` 有座標、HP、存活狀態、當前配料槽與裝備飲料；`projectiles` 有座標、半徑、原料 ID；`zone` 有中心與半徑；`status` 為 `playing`、`finished` 或 `abandoned`，`winnerId` 可為 `null`。`events` 為最近 40 筆，前端用遞增的 `seq` 去重觸發音效；完整紀錄使用 log API。

伺服器以 20Hz 更新，僅接受玩家的輸入意圖；忽略任何客戶端提供的座標、HP、傷害、命中或勝者。訪客、解鎖、飲料和最近 10 場結束對戰記錄存放於 `server/data/prototype.json`，屬**本機原型儲存**，未包含正式帳號、資料庫、多真人 WebSocket、付費抽卡或營運級防作弊。抽卡先抽未解鎖卡，完全解鎖後才記錄重複數量；此為方便測試的免費規則，並非正式機率。
