import type { DieResult, StrategyContext, StrategyDebug } from './index';

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function isBetter(a: number, b: number, direction: 'better' | 'worse'): boolean {
  return direction === 'better' ? a >= b : a <= b;
}

export function applyBias(results: DieResult[], context: StrategyContext): StrategyDebug {
  let secondRoll: number | undefined;
  results.filter((r) => r.active).forEach((r) => {
    secondRoll = randomInt(1, context.faces);
    if (isBetter(secondRoll, r.result, context.direction)) {
      r.result = secondRoll;
    }
  });
  return { biasSecondRoll: secondRoll };
}
