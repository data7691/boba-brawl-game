import { toppingSprites } from './CardArt';
import type { Drink } from '../models/types';
import { drinkAppearance } from '../data/drinkAppearance';

export function DrinkCup({ drink, className = '' }: { drink: Pick<Drink, 'baseId' | 'dairyId' | 'toppingIds'> | null; className?: string }) {
  const appearance = drinkAppearance(drink);
  return <div className={`drink-cup ${className}`} style={{ '--drink-fluid': appearance.liquid } as React.CSSProperties} aria-hidden="true">
    <div className="drink-cup-liquid" />
    {drink?.dairyId === 'milk_cap' && <div className="drink-cup-foam" />}
    <div className="drink-cup-toppings">
      {(drink?.toppingIds ?? []).flatMap((id, index) => [0,1,2].map(i =>
        <img key={`${index}-${i}`} src={`/assets/avatar/toppings/${toppingSprites[id] || toppingSprites.pearl}`} style={{ left:`${22+i*18+(index?6:0)}%`, bottom:`${4+(i%2)*7+index*11}%` }} alt="" />))}
    </div>
    <img className="drink-cup-shell" src="/assets/avatar/cup/cup-shell-gold-v1.png" alt="" />
  </div>;
}
