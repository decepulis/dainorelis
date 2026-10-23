import AppIntents
internal import ExpoAppIntents

/// Opens a song: from Shortcuts, Siri, or a Spotlight result (Spotlight opens an indexed entity
/// through its type's OpenIntent). JS (AppIntentsHandler) pushes the song screen.
struct OpenSongIntent: OpenIntent {
  static let title: LocalizedStringResource = "Open Song"
  static let description = IntentDescription("Opens a song's lyrics in Dainorėlis.")
  static let openAppWhenRun = true

  @Parameter(title: "Song")
  var target: SongEntity

  @MainActor
  func perform() async throws -> some IntentResult {
    await AppIntentDispatcher.shared.dispatch(name: "openSong", params: ["id": .string(target.id)])
    return .result()
  }
}

struct AppShortcuts: AppShortcutsProvider {
  static var appShortcuts: [AppShortcut] {
    AppShortcut(
      intent: OpenSongIntent(),
      phrases: [
        "Open \(\.$target) in \(.applicationName)",
        "Show \(\.$target) in \(.applicationName)",
        "Open a song in \(.applicationName)",
        "Find a song in \(.applicationName)",
      ],
      shortTitle: "Open Song",
      systemImageName: "music.note"
    )
  }
}
