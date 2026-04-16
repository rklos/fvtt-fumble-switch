import type { DieResult, StrategyContext, StrategyDebug } from './index';

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function applyThreshold(results: DieResult[], context: StrategyContext): StrategyDebug {
  const thresholdValue = Math.ceil(context.faces * (context.thresholdPercent / 100));
  let triggered = false;
  let reroll: number | undefined;

  results.filter((r) => r.active).forEach((r) => {
    const shouldReroll = context.direction === 'better'
      ? r.result <= thresholdValue
      : r.result > context.faces - thresholdValue;

    if (shouldReroll) {
      triggered = true;
      reroll = randomInt(1, context.faces);
      r.result = context.direction === 'better'
        ? Math.max(r.result, reroll)
        : Math.min(r.result, reroll);
    }
  });

  return { thresholdValue, thresholdReroll: reroll, thresholdTriggered: triggered };
}
