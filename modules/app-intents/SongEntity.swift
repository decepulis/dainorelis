import AppIntents
@preconcurrency import CoreSpotlight
internal import ExpoAppIntents
import Foundation
import UniformTypeIdentifiers

/// A song from songs.ts. JS publishes the catalog (kind "song") on launch; ids are the songs' record
/// ids, which saved Shortcuts and Spotlight entries keep, so they must never change.
struct SongEntity: AppEntity, AppIntentEntityRecordConvertible {
  static let typeDisplayRepresentation: TypeDisplayRepresentation = "Song"
  static let defaultQuery = SongQuery()

  var id: String
  @Property(title: "Title") var title: String
  /// the first two lines of the lyrics
  var snippet: String?
  /// the first variant's lyrics, chords and markdown stripped, for Spotlight's full-text search
  var lyrics: String?

  var displayRepresentation: DisplayRepresentation {
    DisplayRepresentation(title: "\(title)", subtitle: snippet.map { "\($0)" })
  }

  init(record: AppIntentEntityRecord) {
    id = record.id
    title = record.title
    snippet = record.subtitle
    lyrics = record.metadata["lyrics"]
  }
}

struct SongQuery: EntityStringQuery, EnumerableEntityQuery {
  func entities(for identifiers: [String]) async throws -> [SongEntity] {
    try await AppIntentEntityStore.shared.entities(ofKind: "song", matching: identifiers)
      .map(SongEntity.init(record:))
  }

  func allEntities() async throws -> [SongEntity] {
    try await AppIntentEntityStore.shared.entities(ofKind: "song").map(SongEntity.init(record:))
  }

  func suggestedEntities() async throws -> [SongEntity] {
    try await allEntities()
  }

  // Siri and Shortcuts search here, without JS: title then lyrics, ignoring case and diacritics,
  // so "zalia" finds "Žalia"
  func entities(matching string: String) async throws -> [SongEntity] {
    let search = string.trimmingCharacters(in: .whitespacesAndNewlines)
    guard !search.isEmpty else { return [] }
    let matches = { (text: String?) in
      text?.range(of: search, options: [.caseInsensitive, .diacriticInsensitive]) != nil
    }
    let songs = try await allEntities()
    let byTitle = songs.filter { matches($0.title) }
    return byTitle + songs.filter { !matches($0.title) && matches($0.lyrics) }
  }
}

@available(iOS 18.0, *)
extension SongEntity: IndexedEntity {
  var attributeSet: CSSearchableItemAttributeSet {
    let attributes = defaultAttributeSet
    attributes.title = title
    attributes.displayName = title
    // searched but not shown; the snippet is what shows under the title
    attributes.textContent = lyrics
    attributes.contentDescription = snippet
    return attributes
  }
}

// lets the system rebuild the index on its own schedule (iOS 27 SDK)
#if compiler(>=6.4)
@available(iOS 27.0, *)
extension SongQuery: IndexedEntityQuery {
  func reindexEntities(
    for identifiers: [SongEntity.ID],
    indexDescription: CSSearchableIndexDescription
  ) async throws {
    try await AppEntityIdentifierRegistry.shared.updateIndexFromCatalog(kind: "song", matching: identifiers)
  }

  func reindexAllEntities(indexDescription: CSSearchableIndexDescription) async throws {
    try await AppEntityIdentifierRegistry.shared.replaceIndexFromCatalog(kind: "song")
  }
}
#endif
