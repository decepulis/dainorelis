import SwiftUI

struct SongListView: View {
    let songs = loadSongs()
    
    var body: some View {
        NavigationStack {
            List(songs) { song in
                NavigationLink(song.title) {
                    SongDetailView(song: song)
                }
                .font(.system(.body, design: .rounded))
            }
            .navigationTitle("Dainorėlis")
        }
    }
}
