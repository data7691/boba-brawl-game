import type { Drink } from '../models/types';

export type DrinkRecipe = Pick<Drink, 'baseId' | 'dairyId' | 'toppingIds'>;

export function drinkAppearance(drink: DrinkRecipe | null) {
  const green = drink?.baseId === 'green_tea';
  if (drink?.dairyId === 'milk') return green
    ? { liquid: '#95a76a', deep: '#5c7247', swirl: '#f4eed3' }
    : { liquid: '#b77540', deep: '#754526', swirl: '#fff0d5' };
  if (drink?.dairyId === 'creamer') return green
    ? { liquid: '#adb072', deep: '#6f7449', swirl: '#f2dc9d' }
    : { liquid: '#c19461', deep: '#805a37', swirl: '#f7d49c' };
  if (drink?.dairyId === 'milk_cap') return green
    ? { liquid: '#82974a', deep: '#4a642c', swirl: '#fff8e7' }
    : { liquid: '#a26133', deep: '#674022', swirl: '#fff8e7' };
  return green
    ? { liquid: '#6c8425', deep: '#344b17', swirl: null }
    : { liquid: '#934517', deep: '#4f220e', swirl: null };
}
