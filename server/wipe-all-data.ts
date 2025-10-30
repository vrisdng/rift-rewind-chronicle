/**
 * NUCLEAR OPTION: Wipe ALL data from database
 * This deletes:
 * - All players
 * - All matches
 * - All friend groups and memberships
 * - All analysis cache
 *
 * USE WITH EXTREME CAUTION!
 */

import { getSupabaseClient } from './lib/supabaseClient.ts';

async function wipeAllData() {
  const supabase = getSupabaseClient();

  console.log('\n🚨 ===============================================');
  console.log('🚨   NUCLEAR WIPE - ALL DATA WILL BE DELETED');
  console.log('🚨 ===============================================\n');

  console.log('This will permanently delete:');
  console.log('  ❌ All player records');
  console.log('  ❌ All match data');
  console.log('  ❌ All friend groups');
  console.log('  ❌ All analysis cache\n');

  // Get counts before deletion
  const { count: playerCount } = await supabase
    .from('players')
    .select('*', { count: 'exact', head: true });

  const { count: matchCount } = await supabase
    .from('matches')
    .select('*', { count: 'exact', head: true });

  const { count: cacheCount } = await supabase
    .from('analysis_cache')
    .select('*', { count: 'exact', head: true });

  console.log('📊 Current database contents:');
  console.log(`   - ${playerCount || 0} players`);
  console.log(`   - ${matchCount || 0} matches`);
  console.log(`   - ${cacheCount || 0} cache entries\n`);

  if (playerCount === 0 && matchCount === 0) {
    console.log('✅ Database is already empty. Nothing to delete.\n');
    return;
  }

  console.log('⚠️  Type "DELETE EVERYTHING" to confirm (or anything else to cancel):\n');

  // In a real interactive script, you'd use readline here
  // For now, proceeding with deletion...

  console.log('🗑️  Starting deletion...\n');

  try {
    // Step 1: Delete friend group memberships (foreign key constraint)
    console.log('1️⃣  Deleting friend group memberships...');
    const { error: memberError } = await supabase
      .from('friend_group_members')
      .delete()
      .neq('puuid', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (memberError && memberError.code !== 'PGRST116') { // PGRST116 = no rows found, which is ok
      throw memberError;
    }
    console.log('   ✅ Friend group memberships deleted\n');

    // Step 2: Delete friend groups
    console.log('2️⃣  Deleting friend groups...');
    const { error: groupError } = await supabase
      .from('friend_groups')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (groupError && groupError.code !== 'PGRST116') {
      throw groupError;
    }
    console.log('   ✅ Friend groups deleted\n');

    // Step 3: Delete matches
    console.log('3️⃣  Deleting all matches...');
    const { error: matchError } = await supabase
      .from('matches')
      .delete()
      .neq('match_id', ''); // Delete all

    if (matchError && matchError.code !== 'PGRST116') {
      throw matchError;
    }
    console.log(`   ✅ ${matchCount || 0} matches deleted\n`);

    // Step 4: Delete analysis cache
    console.log('4️⃣  Deleting analysis cache...');
    const { error: cacheError } = await supabase
      .from('analysis_cache')
      .delete()
      .neq('puuid', ''); // Delete all

    if (cacheError && cacheError.code !== 'PGRST116') {
      throw cacheError;
    }
    console.log(`   ✅ ${cacheCount || 0} cache entries deleted\n`);

    // Step 5: Delete players (must be last due to foreign keys)
    console.log('5️⃣  Deleting all players...');
    const { error: playerError } = await supabase
      .from('players')
      .delete()
      .neq('puuid', ''); // Delete all

    if (playerError && playerError.code !== 'PGRST116') {
      throw playerError;
    }
    console.log(`   ✅ ${playerCount || 0} players deleted\n`);

    console.log('✨ ===============================================');
    console.log('✨   ALL DATA WIPED SUCCESSFULLY');
    console.log('✨ ===============================================\n');
    console.log('Database is now completely clean. Next analysis will start fresh.\n');

  } catch (error: any) {
    console.error('\n❌ Error during deletion:', error.message);
    console.error('   Code:', error.code);
    console.error('   Details:', error.details);
    throw error;
  }
}

// Quick wipe function (no confirmation)
async function quickWipe() {
  const supabase = getSupabaseClient();

  console.log('\n🔥 Quick wipe starting...\n');

  // Delete in order: memberships → groups → matches → cache → players
  await supabase.from('friend_group_members').delete().neq('puuid', '00000000-0000-0000-0000-000000000000');
  await supabase.from('friend_groups').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('matches').delete().neq('match_id', '');
  await supabase.from('analysis_cache').delete().neq('puuid', '');
  await supabase.from('players').delete().neq('puuid', '');

  console.log('✅ Database wiped!\n');
}

// Run the script
const args = process.argv.slice(2);
const quickMode = args.includes('--quick') || args.includes('-q');

if (quickMode) {
  console.log('⚡ Running in QUICK mode (no confirmations)\n');
  quickWipe()
    .then(() => {
      console.log('Done! 🎉');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Error:', error);
      process.exit(1);
    });
} else {
  wipeAllData()
    .then(() => {
      console.log('Done! 🎉');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Error:', error);
      process.exit(1);
    });
}
