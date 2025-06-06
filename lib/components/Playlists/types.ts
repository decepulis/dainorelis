import { z } from 'zod';

const PlaylistSongSchema = z.object({
  id: z.string(),
  v: z.string().optional(), // variant id
  m: z.string().optional(), // media id
});
const PlaylistHeaderSchema = z.object({
  title: z.string(),
  enTitle: z.string().optional(),
});

export const PlaylistSchema = z.object({
  id: z.string(),
  title: z.string(),
  enTitle: z.string().optional(),
  items: z.array(z.union([PlaylistSongSchema, PlaylistHeaderSchema])),
});

export type PlaylistSong = z.infer<typeof PlaylistSongSchema>;
export type PlaylistHeader = z.infer<typeof PlaylistHeaderSchema>;
export type Playlist = z.infer<typeof PlaylistSchema>;
