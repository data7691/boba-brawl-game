# MVP 進度與交付順序

更新：2026-10-05。以下表格保留 10-04 正式 MVP 的歷史基線；最新已有本機單人 Web 可玩縱切：測試抽卡、伺服器驗證的原料解鎖／合成／裝備、信義街區四角色混戰、暗巷隱蔽、音效、結算與 PWA manifest。真人多人連線、20 張正式卡、正式稀有度／經濟、PostgreSQL、iPhone Safari 實機 HTTPS 尚未完成。

| 項目 | 狀態 | 現況／下一步 |
| --- | --- | --- |
| 10 部門與專案骨架 | 已建立 | `01_專案經理(PM)` 已補建；各部門工作檔仍待填寫 |
| 卡片正面與背面 | 已完成概念預覽 | 原有 14 種原料分在兩張卡面圖表，新增奶蓋獨立卡面；另有 4 款卡背。原料總數目前 15 種，24 種名單尚未全數進遊戲 |
| 開卡動畫 | 已完成概念預覽 | 一抽、十連抽、翻面及特殊閃電；機率與稀有度尚未定案 |
| 飲料合成 | 本機試玩已接通伺服器 | 可選茶底、乳品及最多兩種配料；伺服器驗證、儲存與裝備，不消耗原料卡。演出預覽仍需美術打磨 |
| 紙娃娃變化 | 本機試玩第一版完成 | 戰鬥角色各讀取伺服器配方，手持杯依茶底／牛奶／奶精變色並顯示沉底配料，切換彈藥會高亮對應料；角色移動、翻面與吹射時杯跟隨。正式角色手臂拆層與更多杯型仍待美術製作 |
| 即時混戰縱切 | 本機單人可玩 | 信義街區 1 玩家＋3 電腦、暗巷隱蔽、縮圈與結算；配料由吸管射擊，牛奶／奶精／奶蓋提供獨立魔法攻擊，由伺服器判定冷卻與命中。真人多人連線未開始 |
| 架構草案 | 待確認 | 見 `docs/architecture.md`，未獲正式確認 |
| DB／Card／Synthesis／Avatar／BattleState Schema | 占位 | 待玩法關鍵決策後定稿 |
| API 與 WebSocket 規格 | 占位 | 待資料與房間狀態規格後定稿 |
| 20 張測試卡 | 占位 | 14 種已有圖像概念，卡牌數值、技能與其餘卡尚未設計 |
| Git、PWA、實機測試 | 部分完成 | 已有 PWA manifest，Chromium 852×393 橫向畫面無頁面溢出；專案尚非 Git 儲存庫，尚未測 iPhone Safari 實機與 HTTPS |

工作副本：`client/public/assets/cards/concepts/`、`client/public/previews/`。原始檔仍保留在 `C:\遊戲\assets\card-previews` 與 `C:\遊戲\previews`。

吸管射擊試玩實拍：`docs/straw-grass-jelly-mobile-live.png`。2026-10-05 已完成前端建置與 6 項伺服器測試，包括裝備配料綁定、偽造彈藥欄位拒絕、吸管口發射位置及命中判定。

自動瞄準與嘴邊吸管實拍：`docs/auto-aim-mouth-straw-live.png`（對戰發射中）、`docs/auto-aim-mouth-straw-mobile.png`（852×393 橫向）。最新伺服器測試共 8 項通過；仍須 iPhone Safari 實機驗證。

戰鬥紙娃娃規格：`docs/gdd/battle_paper_doll_v1.md`，由 @2 遊戲企劃交付。實際遊戲畫面：`docs/paper-doll-green-tea-grass-jelly.png` 與 `docs/paper-doll-mobile-live.png`。2026-10-05 已對照綠茶仙草與紅茶雙配料，並將測試後的玩家裝備恢復原配方；前端建置、8 項伺服器測試及 852×393 橫向無頁面溢出檢查通過。

下一關：先確認 `docs/gdd/realtime_brawl_concept.md` 與 `docs/architecture.md` 中尚未拍板的房間數值、地圖順序及 MVP 範圍，再完成資料庫、Card／合成／紙娃娃、即時房間狀態與 API／WebSocket 規格；架構通過後才開始正式功能程式。

2026-10-05 乳品魔法試玩增量：牛奶鮮乳光束、奶精奶霧爆散、奶蓋浪牆已接到伺服器、橫向戰鬥按鈕、Canvas 特效與合成音效；奶蓋卡面與杯頂泡沫已加入。設計與數值見 `docs/gdd/dairy_magic_v1.md`，實際施放截圖見 `docs/dairy-magic-mobile-live.png`。這些屬本機單人試玩，茶底防禦與正式多人尚未完成。

2026-10-05 茶底防禦試玩增量：紅茶茶盾、綠茶閃步已加入本機單人對戰；伺服器判定盾值、閃避、衝刺與掩體，手機增加防禦按鈕。首次試玩值見 `docs/gdd/tea_defense_v1.md`。前段茶底防禦「尚未完成」描述為歷史記錄，目前仍待新增烏龍茶、冬瓜茶、四季春與抹茶。

紅茶茶盾實拍：`docs/tea-shield-mobile-live.png`。已檢查 Chromium 852×393 與 667×375 橫向，控制鈕無裁切；前端建置與 20 項測試通過。iPhone Safari 實機尚未驗證。
