import { toppingSprites } from '../CardArt';
import { drinkAppearance, type DrinkRecipe } from '../../data/drinkAppearance';

const cupShell = new Image();
cupShell.src = '/assets/avatar/cup/cup-open-gold-v1.png';
const toppings = new Map(Object.entries(toppingSprites).map(([id, file]) => {
  const image = new Image();
  image.src = `/assets/avatar/toppings/${file}`;
  return [id, image] as const;
}));
const unknownToppings = new Set<string>();

const cup = { x: -23, y: -42, width: 22, height: 31 };
const clusters = [
  { x: .22, y: .78, scale: .25 }, { x: .48, y: .83, scale: .27 },
  { x: .70, y: .78, scale: .24 }, { x: .34, y: .68, scale: .22 },
  { x: .62, y: .68, scale: .24 }, { x: .51, y: .58, scale: .19 },
];

export function drawHeldDrink(ctx: CanvasRenderingContext2D, drink: DrinkRecipe, slot: number, pulse: number, skin: string) {
  const { x, y, width: w, height: h } = cup;
  const appearance = drinkAppearance(drink);
  ctx.save();
  // Hide the fixed drink baked into the first character sheet beneath this layered cup.
  ctx.fillStyle = '#231720';
  ctx.beginPath();
  ctx.moveTo(x + 2, y + 8); ctx.lineTo(x + w - 2, y + 8);
  ctx.lineTo(x + w - 5, y + h - 2); ctx.lineTo(x + 5, y + h - 2);
  ctx.closePath(); ctx.fill();

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x + 3, y + 10); ctx.lineTo(x + w - 3, y + 10);
  ctx.lineTo(x + w - 6, y + h - 3); ctx.lineTo(x + 6, y + h - 3);
  ctx.closePath(); ctx.clip();
  const fill = ctx.createLinearGradient(x, y + 10, x, y + h);
  fill.addColorStop(0, appearance.liquid);
  fill.addColorStop(1, appearance.deep);
  ctx.fillStyle = fill;
  ctx.fillRect(x + 2, y + 9, w - 4, h - 11);
  if (appearance.swirl) {
    ctx.strokeStyle = `${appearance.swirl}91`;
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(x + 5, y + 13); ctx.bezierCurveTo(x + 11, y + 16, x + 7, y + 21, x + 16, y + 23);
    ctx.stroke();
  }

  const ids = drink.toppingIds.slice(0, 2);
  let puddingDrawn = false;
  for (let i = 0; i < clusters.length; i++) {
    const id = ids.length === 1 ? ids[0] : ids[i % ids.length];
    if (!id || (id === 'pudding' && puddingDrawn)) continue;
    if (id === 'pudding') puddingDrawn = true;
    const point = id === 'pudding'
      ? { x: ids.length === 1 ? .5 : ids[0] === 'pudding' ? .36 : .64, y: .75, scale: .36 }
      : clusters[i];
    const size = id === 'pudding' ? 8 : w * point.scale;
    const px = x + w * point.x - size / 2;
    const py = y + h * point.y - size / 2;
    const asset = toppings.get(id);
    if (!asset && !unknownToppings.has(id)) { unknownToppings.add(id); console.warn(`Unknown topping visual: ${id}`); }
    ctx.save();
    if (i % Math.max(ids.length, 1) === slot) {
      ctx.shadowColor = '#fff2ad';
      ctx.shadowBlur = 2.5 + pulse * 7;
    }
    if (asset?.complete && asset.naturalWidth) ctx.drawImage(asset, px, py, size, size);
    else {
      ctx.fillStyle = '#e6d5bd';
      ctx.beginPath(); ctx.arc(px + size / 2, py + size / 2, size / 2, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }
  ctx.restore();

  if (cupShell.complete && cupShell.naturalWidth) ctx.drawImage(cupShell, x, y, w, h);
  else {
    ctx.strokeStyle = '#ffd291'; ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x + 2, y + 8); ctx.lineTo(x + w - 2, y + 8);
    ctx.lineTo(x + w - 5, y + h - 1); ctx.lineTo(x + 5, y + h - 1);
    ctx.closePath(); ctx.stroke();
  }
  if (drink.dairyId === 'milk_cap') {
    ctx.save();
    ctx.fillStyle = '#fff4de'; ctx.strokeStyle = '#d9c29f'; ctx.lineWidth = .8;
    ctx.shadowColor = '#fff5dd'; ctx.shadowBlur = 4;
    ctx.beginPath(); ctx.ellipse(x + w / 2, y + 8.5, 9, 3.6, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ffffffb3'; ctx.beginPath(); ctx.ellipse(x + 8, y + 7.5, 3, .8, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
  // Front fingers restore the impression of a held object after the new cup covers the baked-in cup.
  ctx.fillStyle = skin;
  ctx.beginPath(); ctx.ellipse(x + 3, y + 19, 2.7, 4.1, -.35, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(x + 4, y + 23, 2.2, 3.1, -.25, 0, Math.PI * 2); ctx.fill();
  if (pulse > 0) {
    ctx.strokeStyle = `rgba(255,230,163,${pulse * .9})`;
    ctx.lineWidth = 1 + pulse;
    ctx.beginPath(); ctx.ellipse(x + w / 2, y + 9, 9 + (1 - pulse) * 5, 3 + (1 - pulse) * 2, 0, 0, Math.PI * 2); ctx.stroke();
  }
  ctx.restore();
}
