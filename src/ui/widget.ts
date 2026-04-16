import { MODULE_ID, type CheatState } from '~/constants';

const STATES: CheatState[] = [ 'off', 'better', 'worse' ];
const STATE_LABELS: Record<CheatState, string> = {
  off: 'Off',
  better: '\u25B2',
  worse: '\u25BC',
};

const s = () => game.settings!;

let widget: HTMLDivElement;
let playersContainer: HTMLDivElement;
const playerRows = new Map<string, HTMLDivElement>();

// Track states locally for immediate UI updates (settings save is async for world-scope)
const localState: Record<string, CheatState> = {
  cheatStatePlayers: 'off',
  cheatStateGm: 'off',
};
const playerOverrides: Record<string, CheatState> = {};

function hasActiveOverride(): boolean {
  return Object.values(playerOverrides).some((state) => state !== 'off');
}

function getWidgetStateClass(): string {
  const { cheatStatePlayers: players, cheatStateGm: gm } = localState;
  if (players !== 'off') return `fumble-switch--${players}`;
  if (hasActiveOverride()) {
    const firstActive = Object.values(playerOverrides).find((state) => state !== 'off');
    if (firstActive) return `fumble-switch--${firstActive}`;
  }
  if (gm !== 'off') return `fumble-switch--${gm}`;
  return 'fumble-switch--off';
}

function updateWidgetClass(): void {
  widget.className = `fumble-switch ${getWidgetStateClass()}`;
}

type CheatStateKey = 'cheatStatePlayers' | 'cheatStateGm';

function createToggleRow(label: string, settingKey: CheatStateKey, currentState: CheatState): HTMLDivElement {
  const row = document.createElement('div');
  row.classList.add('fumble-switch__row');

  const rowLabel = document.createElement('span');
  rowLabel.classList.add('fumble-switch__label');
  rowLabel.textContent = label;
  row.appendChild(rowLabel);

  const buttons = document.createElement('div');
  buttons.classList.add('fumble-switch__buttons');

  STATES.forEach((state) => {
    const btn = document.createElement('button');
    btn.classList.add('fumble-switch__btn', `fumble-switch__btn--${state}`);
    if (state === currentState) btn.classList.add('fumble-switch__btn--active');
    btn.textContent = STATE_LABELS[state];
    btn.title = state.charAt(0).toUpperCase() + state.slice(1);
    btn.addEventListener('click', () => {
      localState[settingKey] = state;
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      s().set(MODULE_ID, settingKey, state);
      buttons.querySelectorAll('.fumble-switch__btn').forEach((b) => b.classList.remove('fumble-switch__btn--active'));
      btn.classList.add('fumble-switch__btn--active');
      updateWidgetClass();
    });
    buttons.appendChild(btn);
  });

  row.appendChild(buttons);
  return row;
}

function savePlayerOverrides(): void {
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  s().set(MODULE_ID, 'cheatStatePlayerOverrides', { ...playerOverrides });
}

function createPlayerRow(user: User, userId: string): HTMLDivElement {
  const row = document.createElement('div');
  row.classList.add('fumble-switch__row', 'fumble-switch__row--player');
  row.dataset.userId = userId;

  const rowLabel = document.createElement('span');
  rowLabel.classList.add('fumble-switch__label');
  rowLabel.textContent = user.name;
  row.appendChild(rowLabel);

  const buttons = document.createElement('div');
  buttons.classList.add('fumble-switch__buttons');
  const currentState = playerOverrides[userId] ?? 'off';

  STATES.forEach((state) => {
    const btn = document.createElement('button');
    btn.classList.add('fumble-switch__btn', `fumble-switch__btn--${state}`);
    if (state === currentState) btn.classList.add('fumble-switch__btn--active');
    btn.textContent = STATE_LABELS[state];
    btn.title = state.charAt(0).toUpperCase() + state.slice(1);
    btn.addEventListener('click', () => {
      playerOverrides[userId] = state;
      savePlayerOverrides();
      buttons.querySelectorAll('.fumble-switch__btn').forEach((b) => b.classList.remove('fumble-switch__btn--active'));
      btn.classList.add('fumble-switch__btn--active');
      updateWidgetClass();
    });
    buttons.appendChild(btn);
  });

  row.appendChild(buttons);
  return row;
}

function addPlayerToWidget(user: User): void {
  if (user.isGM) return;
  const userId = user.id;
  if (!userId) return;
  if (playerRows.has(userId)) return;
  const row = createPlayerRow(user, userId);
  playerRows.set(userId, row);
  playersContainer.appendChild(row);
}

function removePlayerFromWidget(userId: string): void {
  const row = playerRows.get(userId);
  if (!row) return;
  row.remove();
  playerRows.delete(userId);
  updateWidgetClass();
}

function makeDraggable(element: HTMLElement, handle: HTMLElement): void {
  let isDragging = false;
  let offsetX = 0;
  let offsetY = 0;

  handle.addEventListener('mousedown', (e: MouseEvent) => {
    isDragging = true;
    offsetX = e.clientX - element.offsetLeft;
    offsetY = e.clientY - element.offsetTop;
    e.preventDefault();
  });

  document.addEventListener('mousemove', (e: MouseEvent) => {
    if (!isDragging) return;
    element.style.left = `${e.clientX - offsetX}px`;
    element.style.top = `${e.clientY - offsetY}px`;
  });

  document.addEventListener('mouseup', () => {
    if (!isDragging) return;
    isDragging = false;
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    s().set(MODULE_ID, 'widgetPosition', {
      top: element.offsetTop,
      left: element.offsetLeft,
    });
  });
}

export function renderWidget(): void {
  if (!game.user?.isGM) return;

  // Initialize local state from settings
  localState.cheatStatePlayers = s().get(MODULE_ID, 'cheatStatePlayers') as CheatState;
  localState.cheatStateGm = s().get(MODULE_ID, 'cheatStateGm') as CheatState;
  const savedOverrides = s().get(MODULE_ID, 'cheatStatePlayerOverrides');
  Object.assign(playerOverrides, savedOverrides);

  widget = document.createElement('div');
  widget.classList.add('fumble-switch', getWidgetStateClass());

  const position = s().get(MODULE_ID, 'widgetPosition') as { top: number; left: number };
  widget.style.top = `${position.top}px`;
  widget.style.left = `${position.left}px`;

  // Header
  const header = document.createElement('div');
  header.classList.add('fumble-switch__header');

  const title = document.createElement('span');
  title.classList.add('fumble-switch__title');
  title.textContent = game.i18n.localize('FUMBLE_SWITCH.widget.title');
  header.appendChild(title);

  const gear = document.createElement('button');
  gear.classList.add('fumble-switch__gear');
  const gearIcon = document.createElement('i');
  gearIcon.className = 'fas fa-cog';
  gear.appendChild(gearIcon);
  gear.title = game.i18n.localize('FUMBLE_SWITCH.widget.diceSettings');
  gear.addEventListener('click', () => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    new foundry.applications.settings.SettingsConfig({ initialCategory: MODULE_ID }).render(true);
  });
  header.appendChild(gear);

  widget.appendChild(header);

  // Players row
  widget.appendChild(createToggleRow(
    game.i18n.localize('FUMBLE_SWITCH.widget.players'),
    'cheatStatePlayers',
    localState.cheatStatePlayers,
  ));

  // Per-player rows (between Players and GM)
  playersContainer = document.createElement('div');
  playersContainer.classList.add('fumble-switch__players');
  widget.appendChild(playersContainer);

  game.users?.forEach((user) => {
    if (!user.isGM && user.active) addPlayerToWidget(user);
  });

  // GM row
  widget.appendChild(createToggleRow(
    game.i18n.localize('FUMBLE_SWITCH.widget.gm'),
    'cheatStateGm',
    localState.cheatStateGm,
  ));

  makeDraggable(widget, header);
  document.body.appendChild(widget);

  Hooks.on('userConnected', (user: User, connected: boolean) => {
    if (user.isGM) return;
    const userId = user.id;
    if (!userId) return;
    if (connected) addPlayerToWidget(user);
    else removePlayerFromWidget(userId);
  });
}
