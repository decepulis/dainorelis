export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '14.18';
  };
  public: {
    Tables: {
      audio: {
        Row: {
          album: string | null;
          artist: string | null;
          created_at: string;
          en_variant_name: string | null;
          id: string;
          position: number;
          song_id: string;
          updated_at: string;
          url: string;
          variant_name: string | null;
        };
        Insert: {
          album?: string | null;
          artist?: string | null;
          created_at?: string;
          en_variant_name?: string | null;
          id?: string;
          position?: number;
          song_id: string;
          updated_at?: string;
          url?: string;
          variant_name?: string | null;
        };
        Update: {
          album?: string | null;
          artist?: string | null;
          created_at?: string;
          en_variant_name?: string | null;
          id?: string;
          position?: number;
          song_id?: string;
          updated_at?: string;
          url?: string;
          variant_name?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'audio_song_id_fkey';
            columns: ['song_id'];
            isOneToOne: false;
            referencedRelation: 'songs';
            referencedColumns: ['id'];
          },
        ];
      };
      lyrics: {
        Row: {
          created_at: string;
          en_variant_name: string | null;
          id: string;
          lyrics_and_chords: string;
          notes: string | null;
          position: number;
          show_chords: boolean | null;
          song_id: string;
          updated_at: string;
          variant_name: string | null;
        };
        Insert: {
          created_at?: string;
          en_variant_name?: string | null;
          id?: string;
          lyrics_and_chords?: string;
          notes?: string | null;
          position?: number;
          show_chords?: boolean | null;
          song_id: string;
          updated_at?: string;
          variant_name?: string | null;
        };
        Update: {
          created_at?: string;
          en_variant_name?: string | null;
          id?: string;
          lyrics_and_chords?: string;
          notes?: string | null;
          position?: number;
          show_chords?: boolean | null;
          song_id?: string;
          updated_at?: string;
          variant_name?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'lyrics_song_id_fkey';
            columns: ['song_id'];
            isOneToOne: false;
            referencedRelation: 'songs';
            referencedColumns: ['id'];
          },
        ];
      };
      pdfs: {
        Row: {
          created_at: string;
          en_variant_name: string | null;
          id: string;
          position: number;
          song_id: string;
          updated_at: string;
          url: string;
          variant_name: string | null;
        };
        Insert: {
          created_at?: string;
          en_variant_name?: string | null;
          id?: string;
          position?: number;
          song_id: string;
          updated_at?: string;
          url?: string;
          variant_name?: string | null;
        };
        Update: {
          created_at?: string;
          en_variant_name?: string | null;
          id?: string;
          position?: number;
          song_id?: string;
          updated_at?: string;
          url?: string;
          variant_name?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'pdfs_song_id_fkey';
            columns: ['song_id'];
            isOneToOne: false;
            referencedRelation: 'songs';
            referencedColumns: ['id'];
          },
        ];
      };
      songs: {
        Row: {
          created_at: string;
          en_description: string | null;
          hide: boolean;
          id: string;
          lt_description: string | null;
          music_author: string | null;
          name: string;
          recommended_key: string | null;
          sources: string[] | null;
          tags: string[] | null;
          text_author: string | null;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          en_description?: string | null;
          hide?: boolean;
          id?: string;
          lt_description?: string | null;
          music_author?: string | null;
          name: string;
          recommended_key?: string | null;
          sources?: string[] | null;
          tags?: string[] | null;
          text_author?: string | null;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          en_description?: string | null;
          hide?: boolean;
          id?: string;
          lt_description?: string | null;
          music_author?: string | null;
          name?: string;
          recommended_key?: string | null;
          sources?: string[] | null;
          tags?: string[] | null;
          text_author?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      translations: {
        Row: {
          ai_generated: boolean | null;
          created_at: string;
          en_variant_name: string | null;
          id: string;
          lyrics: string;
          notes: string | null;
          position: number;
          song_id: string;
          title: string | null;
          updated_at: string;
          variant_name: string | null;
        };
        Insert: {
          ai_generated?: boolean | null;
          created_at?: string;
          en_variant_name?: string | null;
          id?: string;
          lyrics?: string;
          notes?: string | null;
          position?: number;
          song_id: string;
          title?: string | null;
          updated_at?: string;
          variant_name?: string | null;
        };
        Update: {
          ai_generated?: boolean | null;
          created_at?: string;
          en_variant_name?: string | null;
          id?: string;
          lyrics?: string;
          notes?: string | null;
          position?: number;
          song_id?: string;
          title?: string | null;
          updated_at?: string;
          variant_name?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'translations_song_id_fkey';
            columns: ['song_id'];
            isOneToOne: false;
            referencedRelation: 'songs';
            referencedColumns: ['id'];
          },
        ];
      };
      videos: {
        Row: {
          created_at: string;
          en_variant_name: string | null;
          id: string;
          position: number;
          song_id: string;
          updated_at: string;
          variant_name: string | null;
          youtube_link: string;
        };
        Insert: {
          created_at?: string;
          en_variant_name?: string | null;
          id?: string;
          position?: number;
          song_id: string;
          updated_at?: string;
          variant_name?: string | null;
          youtube_link?: string;
        };
        Update: {
          created_at?: string;
          en_variant_name?: string | null;
          id?: string;
          position?: number;
          song_id?: string;
          updated_at?: string;
          variant_name?: string | null;
          youtube_link?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'videos_song_id_fkey';
            columns: ['song_id'];
            isOneToOne: false;
            referencedRelation: 'songs';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      gen_record_id: { Args: never; Returns: string };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    keyof (DefaultSchema['Tables'] & DefaultSchema['Views']) | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums'] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema['CompositeTypes'] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
