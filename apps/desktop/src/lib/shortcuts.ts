import { EDITOR_BINDING_DESCRIPTIONS } from '@/editor/keymap'
import { APP_COMMANDS } from '@/lib/commands/app-commands'

/** One row of a shortcuts listing: a binding and what it does. */
export interface Shortcut {
  binding: string
  description: string
  /** i18next key for the rendered description; `description` remains the English fallback. */
  descriptionKey?: string
}

/**
 * Both keymap scopes, straight from their registries — never hand-listed, so
 * the ⌘/ cheat-sheet and the Keyboard settings section can't drift from the
 * bindings that actually fire.
 */
export const APP_SHORTCUTS: Shortcut[] = APP_COMMANDS.flatMap((command) =>
  command.keybinding
    ? [
        {
          binding: command.keybinding,
          description: command.title,
          ...(command.titleKey !== undefined ? { descriptionKey: command.titleKey } : {}),
        },
      ]
    : [],
)

const EDITOR_SHORTCUT_KEYS: Readonly<Record<string, string>> = {
  'Mod-b': 'shortcuts.bold',
  'Mod-i': 'shortcuts.italic',
  'Mod-e': 'shortcuts.inline-code',
  'Mod-Shift-x': 'shortcuts.strikethrough',
  'Mod-Shift-h': 'shortcuts.highlight',
  'Mod-k': 'shortcuts.link',
  'Mod-Shift-k': 'shortcuts.insert-wikilink',
  'Mod-1': 'shortcuts.heading-1',
  'Mod-2': 'shortcuts.heading-2',
  'Mod-3': 'shortcuts.heading-3',
  'Mod-4': 'shortcuts.heading-4',
  'Mod-5': 'shortcuts.heading-5',
  'Mod-6': 'shortcuts.heading-6',
  'Mod-.': 'shortcuts.fold-bullet',
  'Mod-Enter': 'shortcuts.follow-link-or-task',
  'Mod-Shift-Enter': 'shortcuts.cycle-circle-task',
  'Mod-Shift-7': 'shortcuts.ordered-list',
  'Mod-Shift-8': 'shortcuts.bullet-list',
  'Mod-Shift-9': 'shortcuts.checkbox-list',
  'Alt-ArrowUp': 'shortcuts.move-block-up',
  'Alt-ArrowDown': 'shortcuts.move-block-down',
  'Meta-ArrowUp': 'shortcuts.caret-document-start',
  'Meta-ArrowDown': 'shortcuts.caret-document-end',
  'Shift-Meta-ArrowUp': 'shortcuts.select-document-start',
  'Shift-Meta-ArrowDown': 'shortcuts.select-document-end',
  Escape: 'shortcuts.collapse-selection',
  'Mod-Shift-j': 'shortcuts.open-ai-menu',
}

export const EDITOR_SHORTCUTS: Shortcut[] = Object.entries(EDITOR_BINDING_DESCRIPTIONS).map(
  ([binding, description]) => {
    const descriptionKey = EDITOR_SHORTCUT_KEYS[binding]
    return {
      binding,
      description,
      ...(descriptionKey !== undefined ? { descriptionKey } : {}),
    }
  },
)
