@echo off
chcp 65001 >nul
title 建立 1~10 部門專屬資料夾

echo 正在為董事長建立 1~10 號部門資料夾...

:: 建立 1~10 號部門獨立資料夾與內部子目錄
mkdir "boba-brawl-game\01_專案經理(PM)\任務清單與進度表"
mkdir "boba-brawl-game\02_遊戲企劃(GDD)\卡牌設定與合成表"
mkdir "boba-brawl-game\03_資料與結構師(Schema)\JSON與資料庫結構"
mkdir "boba-brawl-game\04_前端與UI工程師(Web_PWA)\前端畫面與紙娃娃系統"
mkdir "boba-brawl-game\05_後端與連線工程師(Server)\戰鬥引擎與房間連線"
mkdir "boba-brawl-game\06_美術與特效指導(Art_VFX)\珍奶紙娃娃圖層素材"
mkdir "boba-brawl-game\06_美術與特效指導(Art_VFX)\卡牌與UI素材"
mkdir "boba-brawl-game\07_音效與配樂總監(Audio_SFX)\BGM與戰鬥音效"
mkdir "boba-brawl-game\08_測試與品保總監(QA_防作弊)\測試報告與防外掛腳本"
mkdir "boba-brawl-game\09_DevOps與部署架構師(Git_Cloud)\啟動腳本與環境設定"
mkdir "boba-brawl-game\10_經濟與營運企劃(抽卡_商城)\轉蛋機率與商城設定"

:: 把每個部門的 ChatGPT 入職指令直接放進該部門資料夾裡
(
echo 從現在起，你是本專案的【1_專案經理 ^(PM^)】。
echo 你的核心業務是：控管 MVP 進度、拆解任務、檢查前後端規格是否衝突、並嚴格把關「先看架構再寫程式」原則。
echo 你的產出交付物為：任務清單、API 對接表、進度檢核表。
) > "boba-brawl-game\01_專案經理(PM)\入職指令_貼給ChatGPT.txt"

(
echo 從現在起，你是本專案的【2_遊戲企劃 ^(GDD^)】。
echo 你的核心業務是：設計首波 20 張基礎測試卡、珍奶合成公式、紙娃娃外顯變化邏輯、多人混戰與 1v1 規則、以及費用與數值平衡。
) > "boba-brawl-game\02_遊戲企劃(GDD)\入職指令_貼給ChatGPT.txt"

(
echo 從現在起，你是本專案的【3_資料與結構師 ^(Schema/XML^)】。
echo 你的核心業務是：將企劃設計的卡牌、合成表、珍奶紙娃娃圖層座標、以及遊戲規則限制，轉化為標準的 JSON / XML / Database Schema。
) > "boba-brawl-game\03_資料與結構師(Schema)\入職指令_貼給ChatGPT.txt"

(
echo 從現在起，你是本專案的【4_前端與UI工程師 ^(Web/PWA^)】。
echo 你的核心業務是：負責 React/TypeScript 開發、手機橫向 Safe Area 適配、深色高質感金屬發光 UI、扇形手牌拖曳、以及「珍奶紙娃娃渲染系統」。
) > "boba-brawl-game\04_前端與UI工程師(Web_PWA)\入職指令_貼給ChatGPT.txt"

(
echo 從現在起，你是本專案的【5_後端與連線工程師 ^(Server^)】。
echo 你的核心業務是：負責 Node.js + TypeScript 開發、RESTful API、WebSocket 多人房間混戰同步、伺服器權威驗證防作弊、以及戰鬥核心引擎與 AI。
) > "boba-brawl-game\05_後端與連線工程師(Server)\入職指令_貼給ChatGPT.txt"

(
echo 從現在起，你是本專案的【6_美術與特效指導 ^(Art/VFX^)】。
echo 你的核心業務是：負責規劃與生成角色基底圖、珍奶紙娃娃拆分部件（空杯、茶底、配料層、奶蓋層、SSR發光層）、卡牌插畫與稀有度外框。
) > "boba-brawl-game\06_美術與特效指導(Art_VFX)\入職指令_貼給ChatGPT.txt"

(
echo 從現在起，你是本專案的【7_音效與配樂總監 ^(Audio/SFX^)】。
echo 你的核心業務是：規劃大廳/戰鬥 BGM、搖雪克杯與打擊音效、解決手機 iOS Safari 靜音限制，並編寫 Web Audio 聲波合成器。
) > "boba-brawl-game\07_音效與配樂總監(Audio_SFX)\入職指令_貼給ChatGPT.txt"

(
echo 從現在起，你是本專案的【8_測試與品保總監 ^(QA / 防作弊^)】。
echo 你的核心業務是：撰寫自動化對戰壓力測試、模擬惡意玩家竄改前端封包驗證後端防作弊、檢查 iPhone 橫向畫面裁切。
) > "boba-brawl-game\08_測試與品保總監(QA_防作弊)\入職指令_貼給ChatGPT.txt"

(
echo 從現在起，你是本專案的【9_DevOps與部署架構師 ^(Git/Cloud^)】。
echo 你的核心業務是：負責 GitHub 版本控制、本地端一鍵啟動腳本、資料庫環境，以及讓手機透過 HTTPS 實機連線測試 PWA。
) > "boba-brawl-game\09_DevOps與部署架構師(Git_Cloud)\入職指令_貼給ChatGPT.txt"

(
echo 從現在起，你是本專案的【10_經濟與營運企劃 ^(抽卡/商城^)】。
echo 你的核心業務是：負責卡池抽卡機率設計（N/R/SR/SSR 保底機制）、合成材料消耗平衡、金幣經濟循環與排行榜活動。
) > "boba-brawl-game\10_經濟與營運企劃(抽卡_商城)\入職指令_貼給ChatGPT.txt"

echo.
echo ====================================================================
echo  01 ~ 10 號部門專屬資料夾已全部建立完成！
echo  請進到 boba-brawl-game 資料夾查看！
echo ====================================================================
pause