import fs from 'fs';
import path from 'path';
import removeMd from 'remove-markdown';

import type { Song } from '../lib/schemas/songs';
import songs from '../songs';

// tbh github copilot wrote this

// Configure the similarity threshold (0-1, where 1 means identical)
const SIMILARITY_THRESHOLD = 0.4;

// Levenshtein distance calculation
function levenshteinDistance(str1: string, str2: string): number {
  const track = Array(str2.length + 1)
    .fill(null)
    .map(() => Array(str1.length + 1).fill(null));

  for (let i = 0; i <= str1.length; i += 1) {
    track[0][i] = i;
  }

  for (let j = 0; j <= str2.length; j += 1) {
    track[j][0] = j;
  }

  for (let j = 1; j <= str2.length; j += 1) {
    for (let i = 1; i <= str1.length; i += 1) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      track[j][i] = Math.min(
        track[j][i - 1] + 1, // deletion
        track[j - 1][i] + 1, // insertion
        track[j - 1][i - 1] + indicator // substitution
      );
    }
  }

  return track[str2.length][str1.length];
}

// Calculate similarity score between two strings (0-1)
function calculateSimilarity(str1: string, str2: string): number {
  if (str1 === str2) return 1.0;

  const maxLength = Math.max(str1.length, str2.length);
  if (maxLength === 0) return 1.0;

  const distance = levenshteinDistance(str1, str2);
  return 1 - distance / maxLength;
}

// Normalize text for better comparison
function normalizeText(text: string): string {
  return removeMd(text) // Remove markdown
    .toLowerCase() // Convert to lowercase
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '') // Remove punctuation
    .trim(); // Trim whitespace
}

// Extract lyrics from a song
function extractLyrics(song: Song): { songId: string; songName: string; variantName: string; lyrics: string }[] {
  const results: { songId: string; songName: string; variantName: string; lyrics: string }[] = [];

  if (!song.fields.Lyrics || !Array.isArray(song.fields.Lyrics)) {
    return results;
  }

  for (const lyricVariant of song.fields.Lyrics) {
    if (lyricVariant['Lyrics & Chords']) {
      results.push({
        songId: song.id,
        songName: song.fields.Name || 'Unknown',
        variantName: lyricVariant['Variant Name'] || 'Unknown variant',
        lyrics: normalizeText(lyricVariant['Lyrics & Chords']),
      });
    }
  }

  return results;
}

// Format time in seconds to a human-readable format
function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}m ${remainingSeconds}s`;
}

// Main function to find similar lyrics
function findSimilarLyrics() {
  console.log('🔍 Analyzing lyrics for similarities...');

  // Extract all lyrics from songs
  const allLyrics: ReturnType<typeof extractLyrics> = [];
  for (const song of songs) {
    allLyrics.push(...extractLyrics(song));
  }

  console.log(`📝 Extracted lyrics from ${allLyrics.length} song variants`);

  // Calculate total comparisons
  const totalComparisons = (allLyrics.length * (allLyrics.length - 1)) / 2;
  console.log(`🔄 Will perform ${totalComparisons} comparisons`);

  // Progress tracking
  let comparisonsCompleted = 0;
  let similarFound = 0;
  const startTime = Date.now();
  const logInterval = 1000; // Log progress every 1000 comparisons
  const progressBar = {
    lastLoggedAt: 0,
    lastPercentage: 0,
  };

  // Compare each pair of lyrics
  const similarPairs: {
    song1: string;
    variant1: string;
    song2: string;
    variant2: string;
    similarity: number;
  }[] = [];

  for (let i = 0; i < allLyrics.length; i++) {
    for (let j = i + 1; j < allLyrics.length; j++) {
      // Skip comparing variants of the same song
      if (allLyrics[i].songId === allLyrics[j].songId) {
        continue;
      }

      const similarity = calculateSimilarity(allLyrics[i].lyrics, allLyrics[j].lyrics);
      comparisonsCompleted++;

      // Log progress at intervals
      if (comparisonsCompleted % logInterval === 0 || comparisonsCompleted === totalComparisons) {
        const elapsedSeconds = (Date.now() - startTime) / 1000;
        const percentage = Math.floor((comparisonsCompleted / totalComparisons) * 100);

        // Only log if the percentage has changed
        if (percentage > progressBar.lastPercentage) {
          const estimatedTotalSeconds = (elapsedSeconds * totalComparisons) / comparisonsCompleted;
          const remainingSeconds = estimatedTotalSeconds - elapsedSeconds;

          console.log(
            `⏳ Progress: ${percentage}% (${comparisonsCompleted}/${totalComparisons}) | ` +
              `Found: ${similarFound} similar pairs | ` +
              `Elapsed: ${formatTime(elapsedSeconds)} | ` +
              `Remaining: ~${formatTime(remainingSeconds)}`
          );

          progressBar.lastPercentage = percentage;
        }
      }

      if (similarity >= SIMILARITY_THRESHOLD) {
        similarFound++;
        similarPairs.push({
          song1: allLyrics[i].songName,
          variant1: allLyrics[i].variantName,
          song2: allLyrics[j].songName,
          variant2: allLyrics[j].variantName,
          similarity: similarity,
        });
      }
    }
  }

  // Sort by similarity (descending)
  similarPairs.sort((a, b) => b.similarity - a.similarity);

  // Calculate total time
  const totalSeconds = (Date.now() - startTime) / 1000;
  console.log(`\n✅ Analysis completed in ${formatTime(totalSeconds)}`);

  // Output results
  console.log(`\n🎵 Found ${similarPairs.length} similar song pairs (similarity >= ${SIMILARITY_THRESHOLD}):\n`);

  if (similarPairs.length === 0) {
    console.log('No similar songs found with the current threshold. Try lowering the SIMILARITY_THRESHOLD value.');
  } else {
    for (const pair of similarPairs) {
      console.log(`${pair.song1} (${pair.variant1}) ↔️ ${pair.song2} (${pair.variant2})`);
      console.log(`Similarity: ${(pair.similarity * 100).toFixed(2)}%\n`);
    }

    // Write results to a file
    const outputPath = path.join(__dirname, '..', 'similar-lyrics-report.json');
    fs.writeFileSync(outputPath, JSON.stringify(similarPairs, null, 2));
    console.log(`✅ Report saved to ${outputPath}`);
  }
}

// Run the analysis
findSimilarLyrics();
