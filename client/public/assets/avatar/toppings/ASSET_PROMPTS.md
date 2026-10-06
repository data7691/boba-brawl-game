# 合成預覽配料素材

以下透明 PNG 為合成畫面專用視覺素材，以既有原料卡圖為參考生成；並非正式卡牌數值或合成規則。

- `pudding-whole-v1.png`：參考 `ingredients-base-01.png` 左下「布丁」。單顆完整焦糖布丁，琥珀色焦糖頂、金黃色布丁身，縮小後可放入透明飲料杯。透明背景，不含碗、卡框或文字。
- `mung-beans-cluster-v1.png`：參考 `ingredients-toppings-02.png` 右上「綠豆」。約二十五顆小型熟綠豆，以不規則低矮小堆呈現，保留青綠色與豆粒細縫。透明背景，不含碗、湯匙、卡框或文字。
- `peanuts-cluster-v1.png`：參考 `ingredients-toppings-02.png` 右下「花生」。四至六顆飽滿的去殼花生，金棕色、中央凹痕與糖漿光澤。透明背景，不含碗、湯匙、卡框或文字。

三張圖皆由 OpenAI ImageGen 生成，供目前獨立互動預覽使用。杯底以各素材圖層重複排列，不將整杯飲料烘焙成單一圖片。

## 2026-10-04 卡面一致性修訂

以下七張透明 PNG 也由 OpenAI ImageGen 內建模式產生。每張圖都以對應的既有原料卡圖為**參考圖**，要求真透明背景、單一鬆散配料群、無卡框／容器／文字，以便杯內獨立排列和落下。

| 檔案 | 參考卡 | 生成提示重點 |
| --- | --- | --- |
| `red-beans-cluster-v1.png` | `ingredients-base-01.png` 的紅豆 | 八顆不規則橢圓形熟紅豆，深石榴紅與栗紅色豆皮、細小淺色豆臍、濕潤糖漿光澤；不要圓形珍珠。 |
| `grass-jelly-cubes-v1.png` | `ingredients-base-01.png` 的仙草 | 四塊切成方形的仙草凍，近黑半透明、平坦切面、些微不齊的邊、紫褐反光和濕潤表面；不要黑色圓點。 |
| `coconut-cubes-v1.png` | `ingredients-base-01.png` 的椰果 | 四塊大致方形的椰果，乳白半透明、柔和斜切邊、內部小氣泡與偏冷色的折射高光。 |
| `yellow-jelly-cubes-v1.png` | `ingredients-toppings-02.png` 的粉粿 | 四塊琥珀金黃半透明方形粉粿，清楚厚度、切面、些微不規則邊緣、內部折射與糖漿光澤。 |
| `black-pearls-cluster-v1.png` | `ingredients-base-01.png` 的珍珠 | 七顆經典小珍珠，深栗褐至近黑、略微不規則、琥珀色內透與糖漿反光；不要扁平黑點。 |
| `white-pearls-cluster-v1.png` | `ingredients-toppings-02.png` 的白玉珍珠 | 七顆乳白半透的白玉珍珠，些微不規則球體、奶油色內透和柔和濕亮高光；不要白色平面圓點。 |
| `boba-cluster-v1.png` | `ingredients-toppings-02.png` 的波霸 | 五顆明顯比普通珍珠大的深褐色波霸，飽滿、略微不規則、琥珀邊緣與厚糖漿光澤。 |

上述七張的完整提示皆以 `Use case: background-extraction` 開頭，並指定 `transparent_background: true`；視角為略微正面三分之四視角的擬真 3D 食物質感。生成時明確排除碗、湯匙、卡框、字、杯子、茶湯及其他配料。
