import type { Card } from '../models/types';

const sprites: Record<string, [number, number, number]> = {
  red_tea:[1,0,0], green_tea:[1,1,0], milk:[1,2,0], creamer:[1,0,1],
  pearl:[1,1,1], grass_jelly:[1,2,1], pudding:[1,0,2], red_bean:[1,1,2], coconut_jelly:[1,2,2],
  white_pearl:[2,0,0], boba:[2,1,0], mung_bean:[2,2,0], yellow_jelly:[2,0,1], peanut:[2,1,1]
};

export function CardArt({ card, small = false }: { card: Card; small?: boolean }) {
  if (card.id === 'milk_cap') return <span className={`card-art ${small ? 'card-art-small' : ''}`}
    style={{ backgroundImage: "url('/assets/cards/concepts/milk-cap-card-art-v1.png')", backgroundSize: 'cover', backgroundPosition: 'center' }}
    role="img" aria-label={card.name} />;
  const [sheet,col,row] = sprites[card.id] ?? [1,0,0];
  const style = sheet === 1
    ? { backgroundImage: "url('/assets/cards/concepts/ingredients-base-01.png')", backgroundSize: '340% 340%', backgroundPosition: `${[5,50,95][col]}% ${[2,49,95][row]}%` }
    : { backgroundImage: "url('/assets/cards/concepts/ingredients-toppings-02.png')", backgroundSize: '310% 235%', backgroundPosition: row === 0 ? `${[2,50,98][col]}% 3%` : `${[22,78][col]}% 86%` };
  return <span className={`card-art ${small ? 'card-art-small' : ''}`} style={style} role="img" aria-label={card.name} />;
}

export const toppingSprites: Record<string, string> = {
  pearl:'black-pearls-cluster-v1.png', grass_jelly:'grass-jelly-cubes-v1.png', pudding:'pudding-whole-v1.png',
  red_bean:'red-beans-cluster-v1.png', coconut_jelly:'coconut-cubes-v1.png', white_pearl:'white-pearls-cluster-v1.png',
  boba:'boba-cluster-v1.png', mung_bean:'mung-beans-cluster-v1.png', yellow_jelly:'yellow-jelly-cubes-v1.png', peanut:'peanuts-cluster-v1.png'
};
