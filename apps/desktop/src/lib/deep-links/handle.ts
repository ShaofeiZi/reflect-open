import {
  captureInboxSpool,
  resolveNoteTarget,
  textCaptureEnvelopeSchema,
} from '@reflect/core'
import { translate } from '@/lib/i18n'
import { startOperation } from '@/lib/operations'
import { userErrorMessage } from '@/lib/user-error-message'
import { routeForPath, type Route } from '@/routing/route'
import { parseDeepLink } from '@/lib/deep-links/parse'

/** What acting on a deep link needs from the open graph session. */
export interface DeepLinkIo {
  navigate: (route: Route) => void
  /** `GraphInfo.generation` — pins the capture spool to the issuing graph. */
  generation: number
  /**
   * Whether the graph session or navigation intent changed while the handler
   * awaited. Note resolution queries whichever index is open when it runs, so
   * a stale result must be dropped, never navigated — it may name a homonym
   * note in the newly opened graph or override a newer user action. (The
   * capture path needs no gate: the spool write is generation-pinned in Rust
   * and fails loudly when stale.)
   */
  isStale?: () => boolean
}

/**
 * Act on one incoming `reflect://` URL: navigation links navigate (a note
 * target resolving through the index first), capture links spool an envelope
 * into `.reflect/inbox/` for the watcher-triggered drain to materialize.
 * Every outcome that isn't a navigation surfaces on the operations status
 * line — an outside-world input must never crash or silently vanish.
 */
export async function handleDeepLink(url: string, io: DeepLinkIo): Promise<void> {
  const link = parseDeepLink(url)
  if (link === null) {
    startOperation(translate('operations.links.opening')).fail(
      translate('operations.links.unrecognized', { url: truncate(url) }),
    )
    return
  }
  switch (link.kind) {
    case 'navigate':
      io.navigate(link.route)
      return
    case 'openNote': {
      let path: string | null
      try {
        path = await resolveNoteTarget(link.target)
      } catch (cause) {
        if (io.isStale?.() === true) {
          return
        }
        startOperation(translate('operations.links.opening')).fail(userErrorMessage(cause))
        return
      }
      if (io.isStale?.() === true) {
        return // the graph switched mid-resolve; the result answers the wrong graph
      }
      if (path === null) {
        startOperation(translate('operations.links.opening')).fail(
          translate('operations.links.note-not-found', { target: truncate(link.target) }),
        )
        return
      }
      io.navigate(routeForPath(path))
      return
    }
    case 'capture': {
      const label = translate(
        link.capture === 'task' ? 'operations.links.task-added' : 'operations.links.added',
      )
      try {
        // The URL parser enforces the same text constraints, so this parse is
        // belt-and-braces — but it is fallible, and a schema tightening must
        // surface like every other failure here, not escape the handler.
        const envelope = textCaptureEnvelopeSchema.parse({
          version: 1,
          id: crypto.randomUUID(),
          kind: link.capture,
          text: link.text,
          capturedAt: new Date().toISOString(),
          source: 'deep-link',
        })
        await captureInboxSpool(`${envelope.id}.json`, JSON.stringify(envelope), io.generation)
      } catch (cause) {
        startOperation(translate('operations.links.saving-capture')).fail(userErrorMessage(cause))
        return
      }
      startOperation(label).done()
    }
  }
}

/** Status-line-sized excerpt of an untrusted URL or target. */
function truncate(value: string): string {
  return value.length > 80 ? `${value.slice(0, 77)}…` : value
}
