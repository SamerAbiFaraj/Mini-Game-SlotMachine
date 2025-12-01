/**
 * Returns a random integer between min (inclusive) and max (inclusive).
 */
export const randomInt = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

/**
 * Picks an item from a list based on weights.
 */
export const pickWeighted = <T,>(items: { value: T; weight: number }[]): T => {
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  let random = Math.random() * totalWeight;
  
  for (const item of items) {
    if (random < item.weight) {
      return item.value;
    }
    random -= item.weight;
  }
  
  return items[items.length - 1].value;
};
