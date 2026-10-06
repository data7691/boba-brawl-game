# 乳品魔法・單機試玩第一版

2026-10-05 董事長確認：乳品是獨立施放的魔法攻擊。每杯飲料可選 0～1 種乳品；未加乳品時無魔法。配料仍是吸管彈藥，茶底的防禦能力尚待設計。以下數值是 100 HP 的首次試玩值，依實際對戰調整。

| 原料 | 技能 | 攻擊與反制 | 冷卻 |
| --- | --- | --- | --- |
| 牛奶 | 鮮乳光束 | 自動瞄準最近可見敵人；0.45 秒預警後直線射出，長 520、寬 18、12 傷；命中自身回 3 HP。掩體與隱蔽區邊界可擋，橫移可閃 | 12 秒 |
| 奶精 | 奶霧爆散 | 0.35 秒預警後，半徑 95 的近身範圍對每名敵人造成 10 傷；不穿掩體或隱蔽區邊界。拉開距離可躲 | 11 秒 |
| 奶蓋 | 奶蓋浪牆 | 0.2 秒預警後推出寬 95、前進 280 的泡沫弧；每人最多受擊一次，13 傷並輕推 12。碰掩體消散，不能把圈內敵人推到圈外 | 15 秒 |

手機右下方獨立魔法鍵，鍵盤 E 也可施放；施法方向由伺服器依最近可見敵人或角色面向決定。伺服器持有冷卻、命中、傷害、治療、推力與戰鬥紀錄；前端只播放畫面與音效。三招的光束、奶霧、浪牆採 Canvas 即時特效與合成音效。

新增奶蓋卡面為獨立美術資產：`client/public/assets/cards/concepts/milk-cap-card-art-v1.png`。以內建 imagegen 製作，提示詞：`stylized-concept. Create a premium game ingredient card art asset for a Taiwanese bubble tea mobile game: a single clear takeaway cup of dark amber tea crowned by a thick, rich, realistic ivory milk foam cap. Visible layered milk foam texture, small glossy bubbles and soft pearlescent highlights. High-end semi-realistic 3D game illustration matching polished beverage card art, warm dramatic studio lighting, dark plum and bronze background, centered object filling most of square composition. No words, no letters, no UI frame, no hands, no character, no extra ingredients. Square image with crisp edges and rich physical materials.`

這是本機單人試玩版本；正式多人同步、茶底防禦能力、24 張完整原料與正式抽卡經濟仍未完成。
