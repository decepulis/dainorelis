struct SongVariant: Codable, Identifiable {
    let id: String
    let variantName: String
    let lyrics: String
}

struct Song: Codable, Identifiable {
    let id: String
    let title: String
    let lyrics: [SongVariant]
}
