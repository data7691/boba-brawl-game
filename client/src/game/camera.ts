export function cameraFor(
  screen: { width: number; height: number },
  arena: { width: number; height: number; viewport: { width: number; height: number } },
  player?: { x: number; y: number },
) {
  const scale = Math.max(.001, Math.min(screen.width / arena.viewport.width, screen.height / arena.viewport.height));
  const width = screen.width / scale, height = screen.height / scale;
  const clamp = (value: number, max: number) => Math.max(0, Math.min(Math.max(0, max), value));
  return {
    scale, width, height,
    x: clamp((player?.x ?? arena.width / 2) - width / 2, arena.width - width),
    y: clamp((player?.y ?? arena.height / 2) - height / 2, arena.height - height),
  };
}
