/**
 * Clear player cache to force re-analysis with new archetype algorithm
 */

import { getSupabaseClient } from './lib/supabaseClient.js';

async function clearPlayerCache() {
  const supabase = getSupabaseClient();

  console.log('🗑️  Clearing player cache...\n');

  try {
    // Option 1: Delete all players (forces complete re-analysis)
    const { data: players, error: fetchError } = await supabase
      .from('players')
      .select('riot_id, tag_line, archetype');

    if (fetchError) {
      throw fetchError;
    }

    if (!players || players.length === 0) {
      console.log('✅ No cached players found. Nothing to clear.');
      return;
    }

    console.log(`📊 Found ${players.length} cached players:\n`);
    
    for (const player of players) {
      console.log(`   - ${player.riot_id}#${player.tag_line} (${player.archetype || 'Unknown'})`);
    }

    console.log('\n❓ What would you like to do?');
    console.log('   1. Delete all cached players (forces complete re-analysis)');
    console.log('   2. Update archetype fields only (keeps matches, recalculates archetypes)');
    console.log('   3. Cancel\n');

    // For now, let's just update the generated_at timestamp to force refresh
    // This way matches are preserved but analysis will be redone
    const { error: updateError } = await supabase
      .from('players')
      .update({ 
        generated_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString() // 48 hours ago
      })
      .gt('generated_at', '2000-01-01');

    if (updateError) {
      throw updateError;
    }

    console.log('✅ Updated all player timestamps to trigger re-analysis');
    console.log('   Next time a player is analyzed, they will be re-calculated with the new algorithm.\n');

  } catch (error: any) {
    console.error('❌ Error clearing cache:', error.message);
    process.exit(1);
  }
}

// Option 2: Complete deletion (use with caution)
async function deleteAllPlayers() {
  const supabase = getSupabaseClient();

  console.log('⚠️  WARNING: This will DELETE all cached player data!');
  console.log('   Matches will be preserved but player records will be removed.\n');

  const { error } = await supabase
    .from('players')
    .delete()
    .gt('generated_at', '2000-01-01');

  if (error) {
    throw error;
  }

  console.log('✅ All player records deleted. Next analysis will be fresh.\n');
}

// Run the script
console.log('🔄 Player Cache Manager\n');
console.log('This script will mark cached players as stale so they get re-analyzed');
console.log('with the improved archetype matching algorithm.\n');

clearPlayerCache()
  .then(() => {
    console.log('Done! 🎉');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
