import { useMemo } from 'react'
import { type EditorMessages } from '@meowdown/react'
import { useTranslation } from 'react-i18next'

/**
 * Localized copy for every user-facing control Meowdown renders inside
 * Reflect's editable and read-only Markdown surfaces.
 */
export function useEditorMessages(): EditorMessages {
  const { t } = useTranslation()

  return useMemo(
    () => ({
      copy: {
        copied: t('editor.meowdown.copy.copied'),
      },
      codeBlock: {
        plainText: t('editor.meowdown.code-block.plain-text'),
        searchLanguage: t('editor.meowdown.code-block.search-language'),
        noLanguages: t('editor.meowdown.code-block.no-languages'),
        languageLabel: (label, value) => {
          if (value === '') return t('editor.meowdown.code-block.plain-text-language')
          if (value === 'math') return t('editor.meowdown.code-block.math-language')
          return label
        },
        customLanguage: (language) =>
          t('editor.meowdown.code-block.custom-language', { language }),
        copyCode: t('editor.meowdown.code-block.copy-code'),
      },
      link: {
        copy: t('editor.meowdown.link.copy'),
        edit: t('editor.meowdown.link.edit'),
        remove: t('editor.meowdown.link.remove'),
        paste: t('editor.meowdown.link.paste'),
        titleOptional: t('editor.meowdown.link.title-optional'),
        save: t('editor.meowdown.link.save'),
      },
      slashMenu: {
        text: t('editor.meowdown.slash-menu.text'),
        heading1: t('editor.meowdown.slash-menu.heading-1'),
        heading2: t('editor.meowdown.slash-menu.heading-2'),
        heading3: t('editor.meowdown.slash-menu.heading-3'),
        heading4: t('editor.meowdown.slash-menu.heading-4'),
        blockquote: t('editor.meowdown.slash-menu.blockquote'),
        bulletList: t('editor.meowdown.slash-menu.bullet-list'),
        orderedList: t('editor.meowdown.slash-menu.ordered-list'),
        taskList: t('editor.meowdown.slash-menu.task-list'),
        checkboxList: t('editor.meowdown.slash-menu.checkbox-list'),
        codeBlock: t('editor.meowdown.slash-menu.code-block'),
        math: t('editor.meowdown.slash-menu.math'),
        table: t('editor.meowdown.slash-menu.table'),
        now: t('editor.meowdown.slash-menu.now'),
        attachFile: t('editor.meowdown.slash-menu.attach-file'),
        noResults: t('editor.meowdown.slash-menu.no-results'),
      },
      tagMenu: {
        loading: t('editor.meowdown.tag-menu.loading'),
        noTags: t('editor.meowdown.tag-menu.no-tags'),
      },
      wikilinkMenu: {
        loading: t('editor.meowdown.wikilink-menu.loading'),
        noNotes: t('editor.meowdown.wikilink-menu.no-notes'),
      },
      table: {
        alignLeft: t('editor.meowdown.table.align-left'),
        alignCenter: t('editor.meowdown.table.align-center'),
        alignRight: t('editor.meowdown.table.align-right'),
        insertLeft: t('editor.meowdown.table.insert-left'),
        insertRight: t('editor.meowdown.table.insert-right'),
        clearContents: t('editor.meowdown.table.clear-contents'),
        deleteColumn: t('editor.meowdown.table.delete-column'),
        deleteTable: t('editor.meowdown.table.delete-table'),
        insertAbove: t('editor.meowdown.table.insert-above'),
        insertBelow: t('editor.meowdown.table.insert-below'),
        deleteRow: t('editor.meowdown.table.delete-row'),
      },
      selectionMenu: {
        commands: t('editor.meowdown.selection-menu.commands'),
        filterCommands: t('editor.meowdown.selection-menu.filter-commands'),
        loading: t('editor.meowdown.selection-menu.loading'),
        noCommands: t('editor.meowdown.selection-menu.no-commands'),
      },
      pendingReplacement: {
        waitingForText: t('editor.meowdown.pending-replacement.waiting-for-text'),
        discard: t('editor.meowdown.pending-replacement.discard'),
        replaceSelection: t('editor.meowdown.pending-replacement.replace-selection'),
        insertBelow: t('editor.meowdown.pending-replacement.insert-below'),
      },
      mermaid: {
        invalidOutput: t('editor.meowdown.mermaid.invalid-output'),
        renderError: (message) => t('editor.meowdown.mermaid.render-error', { message }),
      },
      math: {
        renderError: (message) => t('editor.meowdown.math.render-error', { message }),
      },
      embed: {
        tweet: t('editor.meowdown.embed.tweet'),
        youtubeVideo: t('editor.meowdown.embed.youtube-video'),
      },
    }),
    [t],
  )
}
