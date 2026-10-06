import type { BattleState } from '../models/types';

const street = new Image();
street.src = '/assets/backgrounds/xinyi-street-tile-v1.png';
const landmark = new Image();
landmark.src = '/assets/backgrounds/xinyi-101-tile-v1.png';

export function drawCityMap(ctx: CanvasRenderingContext2D, state: BattleState,
  view: { x: number; y: number; scale: number; rect: { width: number; height: number } }) {
  const { tileSize, width, height } = state.arena;
  const firstCol = Math.max(0, Math.floor(view.x / tileSize));
  const firstRow = Math.max(0, Math.floor(view.y / tileSize));
  const lastCol = Math.min(Math.ceil(width / tileSize) - 1, Math.floor((view.x + view.rect.width / view.scale) / tileSize));
  const lastRow = Math.min(Math.ceil(height / tileSize) - 1, Math.floor((view.y + view.rect.height / view.scale) / tileSize));
  ctx.fillStyle = '#28232d';
  ctx.fillRect(view.x, view.y, view.rect.width / view.scale, view.rect.height / view.scale);
  // Only draw the blocks touched by the camera; never allocate a full-world canvas.
  for (let row = firstRow; row <= lastRow; row++) for (let col = firstCol; col <= lastCol; col++) {
    const x = col * tileSize, y = row * tileSize;
    const tile = col === 4 && row === 1 && landmark.complete && landmark.naturalWidth ? landmark : street;
    if (tile.complete && tile.naturalWidth) ctx.drawImage(tile, x, y, tileSize, tileSize);
    ctx.save();
    ctx.fillStyle = '#191b28d9'; ctx.strokeStyle = '#eec78a88';
    ctx.beginPath(); ctx.roundRect(x + 385, y + 425, 130, 34, 6); ctx.fill(); ctx.stroke();
    ctx.font = '700 12px system-ui'; ctx.textAlign = 'center'; ctx.fillStyle = '#ffe1ab';
    ctx.fillText(col === 4 && row === 1 ? '101 中央街區' : `信義 ${col + 1} 街・${row + 1} 段`, x + 450, y + 447);
    ctx.restore();
  }
}
