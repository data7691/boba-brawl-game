# 調飲預覽杯具素材

這三個透明背景 PNG 是互動預覽專用的分層素材。杯內茶液、配料及動畫由 HTML/CSS/JavaScript 渲染，沒有把整個畫面合成為一張圖。

| 檔案 | 用途 |
| --- | --- |
| `cup-open-gold-v1.png` | 倒茶、加奶、落料時的開口透明杯 |
| `cup-shell-gold-v1.png` | 成品階段的杯蓋與吸管版本 |
| `pour-pitcher-gold-v1.png` | 倒茶／奶時的金屬容器 |

使用內建 imagegen 產生；最終提示詞如下，透明度已保留於 PNG：

**杯具初稿（供封蓋版編輯）：**

> Use case: product-mockup. Asset type: transparent layered game UI asset for an interactive bubble-tea crafting screen. Create one premium, realistic 3D-rendered EMPTY clear takeaway bubble tea cup, centered and straight-on, tall tapered clear plastic vessel with convincing transparent wall thickness, soft condensation droplets, crisp specular highlights and refraction along the edges, clear domed/sealed lid and a wide translucent amber straw. Warm gold studio rim light with subtle plum-toned reflected light to match luxurious fantasy card art. The cup interior must remain visually clear and mostly transparent so a separately rendered changing drink liquid and toppings behind it remain visible. Grounded realistic proportions, polished high-end mobile game quality. Single isolated object, full cup and straw visible with generous transparent padding on all sides. No drink liquid, no tapioca, no loose ingredients, no background, no surface, no labels, no logo, no text, no watermark.

**封蓋版（編輯初稿）：**

> Use case: precise-object-edit. Edit target: the supplied empty premium takeaway cup. Preserve the exact cup silhouette, centered composition, lid, straw, realistic condensation, gold/plum highlights and transparent outer background. Change only the cup BODY INTERIOR: make the broad central body area physically transparent alpha, like a hollow clear vessel, so a separately rendered colored drink and toppings placed behind the image will show clearly through it. Retain detailed glass/plastic edge highlights, rim, droplets, base and a few translucent reflections, but remove the nearly opaque brown fill in the center. No drink, no liquid, no toppings, no text, no logo. The image background and central body window must truly have alpha transparency.

**開口版（編輯封蓋版）：**

> Use case: precise-object-edit. Create an OPEN-cup variant of the supplied premium transparent takeaway cup for the drink-making animation. Preserve the exact tapered clear plastic cup body silhouette, warm gold/plum studio highlights, realistic condensation and mostly alpha-transparent central interior, same centered straight-on framing and dimensions. Remove the domed lid and remove the straw entirely. Replace the top with an open circular plastic rim at the same body position so tea, milk and toppings can visibly fall into the cup. Keep a truly transparent background and mostly transparent interior for separately layered liquid. No liquid, no toppings, no text, no logo, no other objects.

**倒料容器：**

> Use case: product-mockup. Asset type: transparent game UI cutout for an animated bubble tea crafting station. One realistic premium stainless-steel barista pouring pitcher, isolated and already tilted about 45 degrees clockwise as if pouring toward the lower right, with a clearly formed spout on the right and visible open rim, ornate subtle warm gold/plum studio highlights matching luxurious fantasy beverage card art, polished reflective metal and believable depth. Centered object, fully visible, generous transparent padding; no liquid stream, no hands, no cup, no text, no logo, no background, no watermark. True alpha transparency.
