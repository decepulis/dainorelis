/**
 * A song's web link, https://dainorelis.app/dainos/<id>: the website's song page on a phone without the app, the
 * song screen (app/dainos/[id].tsx) as a universal link / Android App Link on one with it. `?v=` opens the variant
 * the sharer is on (songs with more than one), which otherwise would be the one the recipient last chose
 */
export function songUrl(id: string, variantId?: string) {
  return `https://dainorelis.app/dainos/${id}${variantId ? `?v=${encodeURIComponent(variantId)}` : ''}`;
}
