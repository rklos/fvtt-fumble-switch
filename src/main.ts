import '~/ui/widget.scss';
import { MODULE_ID } from '~/constants';
import { registerSettings } from '~/settings';
import { patchRollEvaluate, consumePendingCheatedRoll } from '~/cheat/patch';
import { renderWidget } from '~/ui/widget';
import { initDiceSoNice } from '~/integrations/dice-so-nice';

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
  if (!explicitMode) return;

  // Check rolls attached to the message (systems using Roll.toMessage)
  const hasRollFlag = message.rolls?.some((r) => (r.options as FumbleSwitchRollOptions)?.fumbleSwitchCheated);

  // Check pending flag (systems using ChatMessage.create with custom HTML)
  const hasPendingFlag = consumePendingCheatedRoll();

  if (!hasRollFlag && !hasPendingFlag) return;

  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  ChatMessage.create({
    content: `<em>${game.i18n.localize('FUMBLE_SWITCH.explicit.message')}</em>`,
    speaker: { alias: game.i18n.localize('FUMBLE_SWITCH.explicit.speaker') },
  });
});
