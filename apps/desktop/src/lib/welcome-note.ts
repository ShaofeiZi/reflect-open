import {
  getIndexMeta,
  listFiles,
  newNoteId,
  notePath,
  setIndexMeta,
  slugForTitle,
  upsertFrontmatter,
  writeNote,
} from '@reflect/core'

/**
 * The first-run seed (Plan 15 step 1): a brand-new graph gets one short,
 * pinned guide in the interface language. It doubles as the optional-setup surface —
 * backup and AI keys are pointers into Settings, not a wizard — so onboarding
 * never gates the editor and "skipping" is just not reading the note.
 */

export type WelcomeLanguage = 'en' | 'zh-CN'

interface WelcomeNote {
  readonly title: string
  readonly body: string
}

const WELCOME_NOTES: Readonly<Record<WelcomeLanguage, WelcomeNote>> = {
  en: {
    title: 'How to use Reflect',
    body: `# How to use Reflect

Reflect is a daily notebook: press ⌘D any time to land on today's note and write.

- **Link as you think.** Type \`[[\` and a title — [[Wiki Links]] connect notes. There are no folders.
- **Find anything.** ⌘K searches your whole graph; ⌘/ lists every shortcut.
- **Your files.** Every note is a markdown file in this folder, portable forever.

When you want more, open Settings (⌘,):

- **Backup** — free, private backup of your graph to GitHub.
- **AI providers** — add your own API key to chat with your notes (⌘J). Notes marked private never leave this device.

This note is pinned to the sidebar — unpin it (⌘O) when you're done.
`,
  },
  'zh-CN': {
    title: 'Reflect 使用指南',
    body: `# Reflect 使用指南

Reflect 是一本以每日笔记为核心的笔记本：随时按 ⌘D 即可回到今天的笔记并开始记录。

- **边想边关联。** 输入 \`[[\` 和标题，使用[[双向链接]]连接笔记，无需文件夹。
- **查找任何内容。** ⌘K 搜索整个图谱；⌘/ 查看所有快捷键。
- **你的文件。** 每篇笔记都是此文件夹中的 Markdown 文件，可随时迁移。

需要更多功能时，请打开“设置”（⌘,）：

- **备份** — 将图谱免费、私密地备份到 GitHub。
- **AI 服务商** — 添加你自己的 API 密钥，与笔记对话（⌘J）。标记为私密的笔记绝不会离开此设备。

此笔记已置顶到侧栏；阅读完毕后可按 ⌘O 取消置顶。
`,
  },
}

/** English title-derived path, retained as the stable exported default. */
export const WELCOME_NOTE_PATH = welcomeNotePath('en')

/** Title-derived path for the one-time guide in `language`. */
export function welcomeNotePath(language: WelcomeLanguage): string {
  return notePath(slugForTitle(WELCOME_NOTES[language].title))
}

/**
 * The `index_meta` key marking that onboarding was considered for this graph.
 * `index_clear` deliberately preserves `index_meta`, so the marker survives
 * index rebuilds; only deleting `.reflect/` wholesale resets it.
 */
export const WELCOME_SEEDED_META_KEY = 'welcomeSeeded'

export interface EnsureWelcomeNoteOptions {
  /** File-write generation (`graph.generation`) — pins the listing and write. */
  fileGeneration: number
  /** Index-session generation (`index_open`) — pins the meta marker. */
  indexGeneration: number
  /** Interface language at first seed; the user-authored markdown is never rewritten later. */
  language?: WelcomeLanguage
}

/**
 * Consider onboarding for this graph **exactly once** (find-or-create): when
 * the `welcomeSeeded` marker is absent, an **empty** graph (no markdown under
 * `daily/` or `notes/`) gets the welcome note, a graph with any note at all is
 * someone's existing data and only gets marked. Either way the marker lands,
 * so deleting the note — or emptying the graph entirely — never re-onboards.
 * The marker is stamped after the write: a failed seed retries on the next
 * open, and a retry that finds the note already on disk converges to marking.
 * Returns whether a seed happened.
 */
export async function ensureWelcomeNote(options: EnsureWelcomeNoteOptions): Promise<boolean> {
  if ((await getIndexMeta(WELCOME_SEEDED_META_KEY)) !== null) {
    return false
  }
  const files = await listFiles(options.fileGeneration)
  const seeded = files.length === 0
  if (seeded) {
    const language = options.language ?? 'en'
    const welcome = WELCOME_NOTES[language]
    const source = upsertFrontmatter(welcome.body, { id: newNoteId(), pinned: true })
    await writeNote(welcomeNotePath(language), source, options.fileGeneration)
  }
  await setIndexMeta(WELCOME_SEEDED_META_KEY, 'true', options.indexGeneration)
  return seeded
}
