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
  /// the English title, when the song has a translation
  var synonyms: [String]

  var displayRepresentation: DisplayRepresentation {
    DisplayRepresentation(title: "\(title)")
  }

  init(record: AppIntentEntityRecord) {
    id = record.id
    synonyms = record.synonyms
    title = record.title
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

  // Siri and Shortcuts search here, without JS: ignore case and diacritics, so "zalia" finds "Žalia"
  func entities(matching string: String) async throws -> [SongEntity] {
    let search = string.trimmingCharacters(in: .whitespacesAndNewlines)
    guard !search.isEmpty else { return [] }
    return try await allEntities().filter { song in
      ([song.title] + song.synonyms).contains {
        $0.range(of: search, options: [.caseInsensitive, .diacriticInsensitive]) != nil
      }
    }
  }
}

@available(iOS 18.0, *)
extension SongEntity: IndexedEntity {
  var attributeSet: CSSearchableItemAttributeSet {
    let attributes = CSSearchableItemAttributeSet(contentType: .text)
    attributes.title = title
    attributes.displayName = title
    attributes.alternateNames = synonyms
    attributes.keywords = synonyms
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
