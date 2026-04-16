import '~/ui/widget.scss';
import { MODULE_ID } from '~/constants';
import { registerSettings } from '~/settings';
import { patchRollEvaluate, consumePendingCheatedRoll, consumePendingDebugInfo } from '~/cheat/patch';
import { renderWidget } from '~/ui/widget';
import { initDiceSoNice } from '~/integrations/dice-so-nice';
import { renderDebugMessage } from '~/cheat/debug-message';
import type { DieDebugInfo } from '~/cheat/strategies';

Hooks.once('init', () => {
  registerSettings();
  patchRollEvaluate();
});

Hooks.once('ready', () => {
  renderWidget();
  initDiceSoNice();
});

Hooks.on('createChatMessage', (message: ChatMessage) => {
  if (!game.user?.isGM) return;

  const explicitMode = game.settings.get(MODULE_ID, 'explicitMode');
  const debugMode = game.settings.get(MODULE_ID, 'debugMode');
  if (!explicitMode && !debugMode) return;

  const hasRollFlag = message.rolls?.some((r) => (r.options as FumbleSwitchRollOptions)?.fumbleSwitchCheated);
  const hasPendingFlag = consumePendingCheatedRoll();

  const rollDebug = message.rolls?.flatMap(
    (r) => (r.options as FumbleSwitchRollOptions)?.fumbleSwitchDebug ?? [],
  ) ?? [];
  const pendingDebug = consumePendingDebugInfo();
  const debugInfo: DieDebugInfo[] = rollDebug.length > 0 ? rollDebug : pendingDebug;

  const wasCheated = hasRollFlag || hasPendingFlag || debugInfo.length > 0;
  if (!wasCheated) return;

  const speaker = { alias: game.i18n.localize('FUMBLE_SWITCH.explicit.speaker') };

  if (explicitMode) {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    ChatMessage.create({
      content: `<em>${game.i18n.localize('FUMBLE_SWITCH.explicit.message')}</em>`,
      speaker,
    });
  }

  if (debugMode && debugInfo.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    ChatMessage.create({
      content: renderDebugMessage(debugInfo),
      speaker,
      whisper: [ game.user.id ],
    });
  }
});
