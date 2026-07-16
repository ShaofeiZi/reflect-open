import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const TAURI_ROOT = resolve(import.meta.dirname, '..', '..', 'src-tauri')
const APPLE_ROOT = resolve(TAURI_ROOT, 'gen', 'apple')

function read(path: string): string {
  return readFileSync(path, 'utf8')
}

function stringCatalog(path: string): Record<string, string> {
  const source = read(path)
  return Object.fromEntries(
    [...source.matchAll(/^\s*"([^"]+)"\s*=\s*"((?:[^"\\]|\\.)*)";\s*$/gm)].map(
      ([, key, value]) => [key!, value!],
    ),
  )
}

function expectCatalogParity(englishPath: string, chinesePath: string): void {
  const english = stringCatalog(englishPath)
  const chinese = stringCatalog(chinesePath)

  expect(Object.keys(english).length).toBeGreaterThan(0)
  expect(Object.keys(chinese).sort()).toEqual(Object.keys(english).sort())
  for (const key of Object.keys(english)) {
    const placeholders = (value: string): string[] =>
      [...value.matchAll(/\$\{([^}]+)\}/g)].map((match) => match[1]!).sort()
    expect(placeholders(chinese[key]!), key).toEqual(placeholders(english[key]!))
  }
}

describe('native Apple locales', () => {
  it('keeps macOS/iOS Info.plist and App Shortcut catalogs in sync', () => {
    for (const catalog of ['InfoPlist.strings', 'AppShortcuts.strings']) {
      expectCatalogParity(
        resolve(TAURI_ROOT, 'infoplist', 'en.lproj', catalog),
        resolve(TAURI_ROOT, 'infoplist', 'zh-Hans.lproj', catalog),
      )
    }

    const shortcutPhrases = read(
      resolve(APPLE_ROOT, 'Sources', 'reflect-open', 'RecordingIntents.swift'),
    )
    const appShortcutCatalog = stringCatalog(
      resolve(TAURI_ROOT, 'infoplist', 'en.lproj', 'AppShortcuts.strings'),
    )
    const sourcePhrases = [...shortcutPhrases.matchAll(/"([^"]+in \\\(\.applicationName\))"/g)]
      .map((match) => match[1]!.replace('\\(.applicationName)', '${applicationName}'))
      .sort()
    expect(sourcePhrases).toEqual(Object.keys(appShortcutCatalog).sort())
  })

  it('keeps the share extension catalog in sync with every SwiftUI key', () => {
    const englishPath = resolve(APPLE_ROOT, 'ShareExtension', 'en.lproj', 'Localizable.strings')
    const chinesePath = resolve(
      APPLE_ROOT,
      'ShareExtension',
      'zh-Hans.lproj',
      'Localizable.strings',
    )
    expectCatalogParity(englishPath, chinesePath)

    const source = read(resolve(APPLE_ROOT, 'ShareExtension', 'ShareView.swift'))
    const keys = [...source.matchAll(/Text\("([^"]+)"\)/g)].map((match) => match[1]!).sort()
    expect(keys).toEqual(Object.keys(stringCatalog(englishPath)).sort())
  })

  it('keeps widget and App Intent catalogs in sync with native key references', () => {
    const widgetEnglishPath = resolve(
      APPLE_ROOT,
      'RecordingWidget',
      'en.lproj',
      'Localizable.strings',
    )
    const widgetChinesePath = resolve(
      APPLE_ROOT,
      'RecordingWidget',
      'zh-Hans.lproj',
      'Localizable.strings',
    )
    expectCatalogParity(widgetEnglishPath, widgetChinesePath)

    const widgetSources = [
      'RecordAudioWidget.swift',
      'RecordingActivityWidget.swift',
    ].map((file) => read(resolve(APPLE_ROOT, 'RecordingWidget', file))).join('\n')
    const sharedStopIntent = read(
      resolve(APPLE_ROOT, 'Sources', 'reflect-open', 'StopRecordingLiveActivityIntent.swift'),
    )
    const widgetKeys = [
      ...`${widgetSources}\n${sharedStopIntent}`.matchAll(
        /(?:Text|LocalizedStringKey)\("((?:widget|intent)\.[^"]+)"\)/g,
      ),
      ...sharedStopIntent.matchAll(/LocalizedStringResource\("([^"]+)"\)/g),
    ].map((match) => match[1]!)
    expect([...new Set(widgetKeys)].sort()).toEqual(
      Object.keys(stringCatalog(widgetEnglishPath)).sort(),
    )

    const intentEnglishPath = resolve(
      APPLE_ROOT,
      'Sources',
      'reflect-open',
      'en.lproj',
      'Localizable.strings',
    )
    const intentChinesePath = resolve(
      APPLE_ROOT,
      'Sources',
      'reflect-open',
      'zh-Hans.lproj',
      'Localizable.strings',
    )
    expectCatalogParity(intentEnglishPath, intentChinesePath)

    const intentSources = [
      'RecordingIntents.swift',
      'StopRecordingLiveActivityIntent.swift',
    ].map((file) => read(resolve(APPLE_ROOT, 'Sources', 'reflect-open', file))).join('\n')
    const intentKeys = [
      ...intentSources.matchAll(/LocalizedStringResource\("([^"]+)"\)/g),
    ].map((match) => match[1]!)
    expect([...new Set(intentKeys)].sort()).toEqual(
      Object.keys(stringCatalog(intentEnglishPath)).sort(),
    )
  })

  it('declares every native locale directory in both XcodeGen specs', () => {
    const sourceTemplate = read(resolve(TAURI_ROOT, 'ios.project.yml'))
    const generatedTemplate = read(resolve(APPLE_ROOT, 'project.yml'))

    for (const expected of ['ShareExtension', 'RecordingWidget']) {
      expect(sourceTemplate).toContain(`path: ${expected}`)
      expect(generatedTemplate).toContain(`path: ${expected}`)
    }
    expect(sourceTemplate.match(/includes: \["\*\.lproj\/\*\*"\]/g)).toHaveLength(2)
    expect(generatedTemplate.match(/includes: \["\*\.lproj\/\*\*"\]/g)).toHaveLength(2)
    expect(sourceTemplate).toContain('path: ../../infoplist')
    expect(generatedTemplate).toContain('path: ../../infoplist')
    expect(sourceTemplate).toContain(
      'UIApplicationShortcutItemTitle: RECORD_AUDIO_SHORTCUT_TITLE',
    )
    expect(generatedTemplate).toContain(
      'UIApplicationShortcutItemTitle: RECORD_AUDIO_SHORTCUT_TITLE',
    )
  })

  it('commits generated Xcode target membership for every native catalog', () => {
    const project = read(
      resolve(APPLE_ROOT, 'reflect-open.xcodeproj', 'project.pbxproj'),
    )
    expect(project.match(/isa = PBXVariantGroup;/g)).toHaveLength(5)
    expect(project).toContain('"zh-Hans",')
    expect(project).toContain(
      'A10000000000000000000001 /* Localizable.strings in Resources */',
    )
    expect(project).toContain(
      'A10000000000000000000002 /* Localizable.strings in Resources */',
    )
    expect(project).toContain(
      'A10000000000000000000003 /* Localizable.strings in Resources */',
    )
    expect(project).toContain(
      'A10000000000000000000004 /* InfoPlist.strings in Resources */',
    )
    expect(project).toContain(
      'A10000000000000000000005 /* AppShortcuts.strings in Resources */',
    )
    expect(project).toContain(
      'A50000000000000000000001 /* Resources */',
    )

    const generatedInfo = read(resolve(APPLE_ROOT, 'reflect-open_iOS', 'Info.plist'))
    expect(generatedInfo).toContain('<string>RECORD_AUDIO_SHORTCUT_TITLE</string>')
  })

  it('bundles the Apple Info.plist catalogs into the macOS app resources', () => {
    const macosConfig = read(resolve(TAURI_ROOT, 'tauri.macos.conf.json'))
    expect(macosConfig).toContain('"infoplist/**": "./"')
  })
})
