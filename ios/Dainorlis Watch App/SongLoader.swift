import SwiftUI

func loadSongs() -> [Song] {
    guard let url = Bundle.main.url(forResource: "songs", withExtension: "json"),
          let data = try? Data(contentsOf: url),
          let songs = try? JSONDecoder().decode([Song].self, from: data) else {
        return []
    }
    return songs
}
