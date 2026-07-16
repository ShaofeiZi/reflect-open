import Foundation

#if canImport(AppIntents)
  import AppIntents

  /// Siri / Shortcuts entry points for audio memos (audio-memos wave 3,
  /// V1 parity: "Start recording in Reflect").
  ///
  /// These compile into the app target, so `perform()` runs in the app's own
  /// process — but in a different module from the recording plugin (a static
  /// library compiled through swift-rs). They talk to it through
  /// NotificationCenter; the names mirror the constants in
  /// `plugins/tauri-plugin-recording/ios/Sources/RecordingPlugin.swift`.
  /// Starting goes through the plugin's persisted action queue (the webview
  /// must present recording UI); stopping is finalized natively at once.
  @available(iOS 16.0, *)
  struct StartRecordingIntent: AppIntent {
    static var title = LocalizedStringResource("intent.start.title")
    static var description = IntentDescription(
      LocalizedStringResource("intent.start.description"))
    static var openAppWhenRun = true

    @MainActor
    func perform() async throws -> some IntentResult {
      NotificationCenter.default.post(
        name: Notification.Name("app.reflect.recording.start-requested"), object: nil)
      return .result()
    }
  }

  @available(iOS 16.0, *)
  struct StopRecordingSiriIntent: AppIntent {
    static var title = LocalizedStringResource("intent.stop.title")
    static var description = IntentDescription(
      LocalizedStringResource("intent.stop.description"))
    static var openAppWhenRun = false

    @MainActor
    func perform() async throws -> some IntentResult {
      NotificationCenter.default.post(
        name: Notification.Name("app.reflect.recording.stop-requested"), object: nil)
      return .result()
    }
  }

  @available(iOS 16.4, *)
  struct ReflectAppShortcuts: AppShortcutsProvider {
    static var appShortcuts: [AppShortcut] {
      AppShortcut(
        intent: StartRecordingIntent(),
        phrases: [
          "Start recording in \(.applicationName)",
          "Record an audio memo in \(.applicationName)",
        ],
        shortTitle: LocalizedStringResource("intent.record.short-title"),
        systemImageName: "mic"
      )
      AppShortcut(
        intent: StopRecordingSiriIntent(),
        phrases: ["Stop recording in \(.applicationName)"],
        shortTitle: LocalizedStringResource("intent.stop.short-title"),
        systemImageName: "stop.circle"
      )
    }
  }
#endif
