import SwiftUI

struct VariantPickerView: View {
    let song: Song
    @Binding var selectedVariant: SongVariant
    @Binding var isPresented: Bool

    var body: some View {
        List(song.lyrics) { variant in
            Button {
                selectedVariant = variant
                isPresented = false
            } label: {
                Text(variant.variantName)
                    .font(.system(.body, design: .rounded))
                    .foregroundColor(Color("AccentColor"))
            }
        }
        .navigationTitle("Choose Variant")
    }
}
