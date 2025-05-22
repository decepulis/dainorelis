
import SwiftUI

struct SongDetailView: View {
    let song: Song
    @State private var selectedVariant: SongVariant
    @State private var showingVariantPicker = false

    init(song: Song) {
        self.song = song
        _selectedVariant = State(initialValue: song.lyrics.first!)
    }

    var body: some View {
      ScrollView {
          VStack(alignment: .leading, spacing: 12) {
              Text(selectedVariant.lyrics)
                  .font(.system(.body, design: .rounded))
                  .multilineTextAlignment(.leading)

              if song.lyrics.count > 1 {
                  Button("Variant: \(selectedVariant.variantName)") {
                      showingVariantPicker = true
                  }
                  .font(.footnote)
                  .padding(.top, 4)
              }
          }
          .padding()
      }
      .sheet(isPresented: $showingVariantPicker) {
          VariantPickerView(
              song: song,
              selectedVariant: $selectedVariant,
              isPresented: $showingVariantPicker
          )
      }
        .navigationTitle(song.title)
    }
}
