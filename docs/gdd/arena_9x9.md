# 信義街區 9 × 9 手機畫面版（2026-10-05）

## 已實作

- 一格以手機橫向「可視戰場、不含操作列」900 × 300 世界單位為基準；地圖為 8100 × 2700，橫向與縱向各 9 格。不同手機長寬比可視範圍略有差異，世界與出生點保持一致。
- 四位角色分別出生在西北、東北、西南、東南的安全內縮位置；首次可視狀態不揭露其他角落的對手。
- 鏡頭跟隨角色，不把整張大地圖縮到一個手機畫面。地圖按鈕可展開 81 格示意圖，標示自己、可見對手、四角出生點、安全區與中央 101 街區。
- 以 900 × 900 街區圖塊連接道路；碰撞資料配合圖塊重複配置。中央一個街區採 101 地標版本。這是重複街區的可玩原型，不宣稱 81 格都是獨立美術。
- 躲藏、碰撞、子彈與勝負由伺服器處理。大地圖尋路使用預先建立的通行格、空間索引與有上限的路徑快取。
- 縮圈沿用 30 秒開始；本次大圖暫調為 180 秒收至約一個參考畫面，230 秒完全收攏，240 秒對局上限。往中央移動的四角路線能在縮圈前後安全走完。

## 驗證

- 14 項伺服器／鏡頭測試通過：四角通路、碰撞、視線、隱蔽、射擊、防竄改、收縮、結算、手機鏡頭倍率與四邊界。
- 前端正式建置通過。本機瀏覽器手機橫向檢查與真實截圖另存於 docs。
- iPhone／Android 實機與 Safari 尚未驗證；地圖仍為本機單人加電腦原型。

## 素材紀錄

內建 image_gen 產出，保留舊版背景檔案：

- client/public/assets/backgrounds/xinyi-street-tile-v1.png
- client/public/assets/backgrounds/xinyi-101-tile-v1.png

### 街區最終提示

Use the reference only for the rich Taipei Xinyi dusk game-art MATERIALS and LIGHTING. Generate a square reusable city-block ground tile for a scrolling top-down mobile battle game. CRITICAL: orthographic near-overhead camera, north at image top, streets axis-aligned vertically and horizontally, NO horizon, NO sky, NO distant skyline, NO people, NO characters, NO UI, NO words. A connected street cross passes through the exact center with wide open central intersection. Four compact street blocks occupy the quadrants, keeping center horizontal and vertical roads wide and unobstructed. Each block has a small photoreal stylized Taiwan convenience shop/cafe, air conditioners, awnings, neon, scooters, low planters; buildings are short enough to read their foot prints. The outside 10 percent of ALL FOUR image edges must be open wet dark asphalt road, continuous as a perimeter loop, so adjacent copies can join. Rich warm amber windows, magenta/cyan reflections on wet asphalt, realistic sidewalks, crosswalks, flowerbeds, attractive premium diorama game art, same warm neon color palette as reference. Keep building footprints in four quadrants around normalized positions x20-40% or60-80%, y20-40% or60-80%, no obstacle in the center or outer boundary streets. Seam-compatible square image, uniformly detailed across entire frame, consistent object scale, no depth blur. This is an environment tile asset, not a screenshot.

### 101 街區最終提示

Edit this square Taipei city street tile. Preserve the identical square composition, overhead camera, all four perimeter roads, central street cross, crosswalks, road widths, wet neon amber lighting, and the other three quadrant buildings. ONLY replace the upper-right quadrant building with a stylized miniature Taipei 101 landmark tower, recognizable tiered teal green bamboo-like skyscraper with a spire, shown in the same premium 3D diorama game style. Fit its entire silhouette into the existing upper-right city block footprint, leaving all surrounding roads open and in the exact same places. Its base should occupy that quadrant's original building ground footprint; do not put it on the road. Deliberately use miniature landmark scale appropriate to an overhead mobile game. Warm commercial podium and plaza around its base. No characters, no UI, no text, no labels. All image edges must match original so this landmark tile connects seamlessly to the normal city tile. No sky or horizon.
