# Boba Brawl Game

手機橫向 Web/PWA 珍奶卡片遊戲。董事長已確認取消回合制，方向是**戰前合成並裝備飲料、人物進場變身、即時移動與技能混戰**。

目前已有**本機可玩單人 Web 原型**：免費測試抽卡、飲料合成與裝備、台北信義街區 1 玩家＋3 電腦即時對戰、暗巷隱蔽、音效與結算紀錄。這不是正式多人連線版。請先閱讀 [專案規則](AGENTS.md)、[場地規格](docs/gdd/xinyi_arena.md) 與 [MVP 進度](docs/mvp_checklist.md)。

試玩：在專案根目錄執行 `node server/src/index.mjs`，或在 Windows 雙擊 `scripts/start_dev.bat`，再開啟 <http://127.0.0.1:4180/>。服務視窗需要保持開啟。手機橫向左側拖曳移動、右側按住拖曳射擊；桌面使用 WASD／方向鍵、滑鼠左鍵、Q。訪客收藏與對戰裁定由本機 Node 服務保存／驗證；實機手機連線仍需另外設定區網與可信任 HTTPS。

手機在同一個 Wi-Fi 試玩：雙擊 `scripts/start_phone_test.bat`，查詢電腦的 IPv4 位址後，在手機開啟 `http://電腦IPv4:4181/`。此服務使用獨立測試資料，不會覆寫桌面版的訪客紀錄。電腦須保持開機且允許私人網路連線。此區網 HTTP 連結可測遊戲操作；iPhone「加入主畫面」與完整 PWA 安裝仍需另行部署可信任 HTTPS。GitHub 儲存庫僅保存原始碼，不會自行運行 Node 遊戲伺服器。

現有可互動成果保存在 `client/public/previews/`：

- `card-draw-demo.html`：卡背、單抽／十連抽、翻卡與特殊閃電概念預覽。
- `drink-crafting-demo.html`：14 種原料選擇、開口杯倒茶／奶、配料落杯及封蓋成品概念預覽；`drink-crafting-demo-v1.html` 保留先前版本。

對應圖像在 `client/public/assets/cards/concepts/`。這些預覽未連接正式帳號、庫存、抽卡機率、合成交易或多人戰鬥。原始版本仍保留在上一層 `C:\遊戲\previews` 與 `C:\遊戲\assets\card-previews`。

