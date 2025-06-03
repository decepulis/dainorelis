// Script to enhance song metadata using OpenAI API
import Airtable from 'airtable';
import dotenv from 'dotenv';
import OpenAI from 'openai';

// Load environment variables
dotenv.config();

// Configure Airtable for longer request timeout
Airtable.configure({
  apiKey: process.env.AIRTABLE_TOKEN,
  requestTimeout: 60000, // 60 seconds timeout
});

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Initialize Airtable
const base = new Airtable({ apiKey: process.env.AIRTABLE_TOKEN }).base('appW24b09D9VHYHfi');

interface SongMetadata {
  ltDescription: string;
  enDescription: string;
  enTitle: string;
  enTranslation: string;
}

async function generateSongMetadata(songName: string, lyrics: string): Promise<SongMetadata> {
  try {
    console.log(`Generating metadata for "${songName}"...`);

    const prompt = `
You are an expert in Lithuanian music, culture, and poetry analysis. Please analyze this Lithuanian song:

Title: ${songName}
Lyrics:
${lyrics}

Provide the following:
1. A short description in English (1-3 sentences) explaining what the song is about. Offer interpretation if themes are clear, but express uncertainty when speculating (use phrases like "gali simbolizuoti" instead of definitive statements). Focus more on the text than on interpretation. Use simple and accessible language. If the song references specific Lithuanian traditions, holidays, or historical events, briefly explain their significance. You don't need to mention the name of the song in the description.

2. A short description in Lithuanian (1-3 sentences) with the same information. Use simple and accessible language. Not everyone using reading this has the best Lithuanian skills.

3. An English translation of the title

3. An English translation of the lyrics. Ignore markdown links when translating. Try to preserve the poetic elements like rhythm when possible, while ensuring the meaning is accurately conveyed. For idiomatic expressions or culturally-specific concepts, aim for the closest English equivalent that captures the intended meaning.

Format your response as JSON:
{
  "enDescription": "English description here",
  "ltDescription": "Lithuanian description here",
  "enTitle": "English translation of title here",
  "enTranslation": "English translation of lyrics here"
}
`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4.1',
      messages: [
        { role: 'system', content: 'You are an expert in Lithuanian music, culture, and poetry analysis.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' },
    });

    const responseContent = response.choices[0].message.content;
    if (!responseContent) {
      throw new Error('No response content received from OpenAI');
    }

    const metadata = JSON.parse(responseContent) as SongMetadata;

    return metadata;
  } catch (error) {
    console.error(`Error generating metadata for "${songName}":`, error);
    return {
      enDescription: `Failed to generate description.`,
      ltDescription: `Failed to generate description.`,
      enTitle: `Failed to translate title.`,
      enTranslation: `Failed to generate translation.`,
    };
  }
}

// Function for bulk updates to Airtable
async function bulkUpdateSongMetadata(updates: { id: string; fields: any }[]): Promise<boolean> {
  try {
    console.log(`Performing bulk update for ${updates.length} songs...`);

    // Attempt the update with the original data and typecast=true to allow new select options
    await base('Songs').update(updates, { typecast: true });
    console.log(`✅ Successfully updated ${updates.length} songs in Airtable`);
    return true;
  } catch (error) {
    console.error('Error during bulk update:', error);

    // Adding retry logic with backoff
    console.log('Waiting 5 seconds before retrying...');
    await new Promise((resolve) => setTimeout(resolve, 5000));

    try {
      console.log(`Retrying update for ${updates.length} songs...`);
      await base('Songs').update(updates, { typecast: true });
      console.log(`✅ Retry successful: Updated ${updates.length} songs in Airtable`);
      return true;
    } catch (retryError) {
      console.error('Retry failed:', retryError);
      return false;
    }
  }
}

async function processSongs(limit?: number) {
  try {
    console.log('🎵 Fetching songs from Airtable...');

    // Create a single query to get all the data we need
    let query = base('Songs').select({
      view: 'Grid view',
      fields: [
        'Name',
        'Lyrics',
        'LT Description',
        'EN Description',
        'AI-Generated Description',
        'EN Title',
        'EN Translation',
      ],
    });

    // Get all records (we'll filter for processing later)
    const allRecords = await query.all();

    // Determine which songs to process
    const songsToProcess = limit ? allRecords.slice(0, limit) : allRecords;

    console.log(`Found ${songsToProcess.length} songs to process`);

    // Keep track of stats
    let processed = 0;
    let skipped = 0;
    let noLyrics = 0;
    let errors = 0;

    // Store updates for bulk processing
    const updates: { id: string; fields: any }[] = [];
    const BATCH_SIZE = 10; // Airtable's maximum batch size is 10

    // Fetch all lyrics records for efficiency
    console.log('🎵 Fetching lyrics...');
    const allLyrics = await base('Lyrics & Chords')
      .select({
        view: 'Grid view',
        fields: ['Variant Name', 'Lyrics & Chords'],
      })
      .all();

    // Process each song
    for (let i = 0; i < songsToProcess.length; i++) {
      const record = songsToProcess[i];
      const songName = record.fields.Name as string;

      // Skip if the song already has AI-generated metadata (but don't skip if this is a test run with limit)
      if (
        !limit &&
        record.fields['LT Description'] &&
        record.fields['EN Description'] &&
        record.fields['EN Title'] &&
        record.fields['EN Translation']
      ) {
        console.log(`Skipping "${songName}" - already has AI-generated metadata`);
        skipped++;
        continue;
      } else if (
        limit &&
        (record.fields['LT Description'] ||
          record.fields['EN Description'] ||
          record.fields['EN Title'] ||
          record.fields['EN Translation'])
      ) {
        console.log(`Test run: Overwriting existing metadata for "${songName}"`);
      }

      // Get lyrics for the song
      let lyrics = '';

      if (record.fields.Lyrics && Array.isArray(record.fields.Lyrics)) {
        const lyricsIds = record.fields.Lyrics as string[];

        if (lyricsIds.length > 0) {
          // Find the matching lyrics record
          const lyricsRecord = allLyrics.find((l) => lyricsIds.includes(l.id));

          if (lyricsRecord && lyricsRecord.fields['Lyrics & Chords']) {
            lyrics = lyricsRecord.fields['Lyrics & Chords'] as string;
          }
        }
      }

      if (!lyrics) {
        console.log(`Skipping "${songName}" - no lyrics found`);
        noLyrics++;
        continue;
      }

      try {
        // Generate metadata
        const metadata = await generateSongMetadata(songName, lyrics);

        // Add to batch updates
        updates.push({
          id: record.id,
          fields: {
            'EN Description': metadata.enDescription,
            'LT Description': metadata.ltDescription,
            'AI-Generated Description': true,
            'EN Title': metadata.enTitle,
            'EN Translation': metadata.enTranslation,
          },
        });

        processed++;

        // If we've reached the batch size, process the batch
        if (updates.length >= BATCH_SIZE) {
          const success = await bulkUpdateSongMetadata(updates);
          if (success) {
            updates.length = 0; // Clear the array only on success
            // Add a delay between batch updates to avoid connection problems
            console.log('Waiting 2 seconds before processing the next batch...');
            await new Promise((resolve) => setTimeout(resolve, 2000));
          } else {
            // If the update failed after retries, drop the current batch and start fresh
            console.log('Failed to update batch after retry. Starting fresh with a new batch.');
            updates.length = 0;
          }
        }

        // Add a small delay to avoid rate limiting for OpenAI
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (err) {
        console.error(`Error processing "${songName}":`, err);
        errors++;
      }
    }

    // Process any remaining updates
    if (updates.length > 0) {
      const success = await bulkUpdateSongMetadata(updates);
      if (!success) {
        console.log('⚠️ Final batch update failed after retries.');
      }
    }

    // Display summary statistics
    console.log('\n✨ Metadata enhancement complete!');
    console.log(`📊 Summary:
    - Total songs found: ${songsToProcess.length}
    - Songs processed: ${processed}
    - Songs skipped (already had metadata): ${skipped}
    - Songs skipped (no lyrics): ${noLyrics}
    - Errors: ${errors}
    `);
  } catch (error) {
    console.error('Error processing songs:', error);
  }
}

// translations  were moved to their own table
// I'd suggest just opening up ChatGPT and pasting in the prompt yourself
console.error('⚠️ This script no longer matches the current Airtable schema. Update before running,');
// // Allow running with a limit for testing
// const args = process.argv.slice(2);
// const limitArg = args.find((arg) => arg.startsWith('--limit='));
// const limit = limitArg ? parseInt(limitArg.split('=')[1], 10) : undefined;

// // Run the script
// processSongs(limit).catch((error) => {
//   console.error('Script failed:', error);
//   process.exit(1);
// });
