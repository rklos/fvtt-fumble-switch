import type { DieResult, StrategyContext, StrategyDebug } from './index';

export function applyNudge(results: DieResult[], context: StrategyContext): StrategyDebug {
  const delta = context.direction === 'better' ? context.nudgeValue : -context.nudgeValue;
  results.filter((r) => r.active).forEach((r) => {
    r.result = Math.max(1, Math.min(context.faces, r.result + delta));
  });
  return { nudgeDelta: delta };
}
