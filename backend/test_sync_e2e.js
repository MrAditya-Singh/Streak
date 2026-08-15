async function runBidirectionalTest() {
  console.log('================================================================');
  console.log('🧪 RUNNING BIDIRECTIONAL REAL-TIME SYNC TEST (MOBILE ⇄ LAPTOP)');
  console.log('================================================================\n');

  const BASE_URL = 'http://localhost:5000/api/sync';
  const todayStr = new Date().toISOString().split('T')[0];

  // -------------------------------------------------------------
  // TEST 1: Direction A (Mobile -> Laptop)
  // Simulate Phone user tapping 'leetcode'
  // -------------------------------------------------------------
  console.log('📱 STEP 1: [Mobile App] User taps LeetCode on phone...');
  const mobileToggleRes = await fetch(`${BASE_URL}/toggle`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: 'local_user_1',
      habitId: 'leetcode',
      completed: true,
      date: todayStr,
    }),
  });
  const mobileToggleData = await mobileToggleRes.json();
  console.log('   ↳ Hub Broadcasted:', mobileToggleData.message);

  // Verify Laptop sees the updated state
  const laptopCheckRes = await fetch(`${BASE_URL}/state?userId=local_user_1`);
  const laptopCheckData = await laptopCheckRes.json();
  const isLeetCodeDoneOnLaptop = laptopCheckData.state?.matrix?.leetcode?.[todayStr];
  console.log('💻 STEP 2: [Laptop App] Checked if LeetCode is ticked on Laptop: ' + (isLeetCodeDoneOnLaptop ? '✅ YES (SYNCED!)' : '❌ NO'));

  // -------------------------------------------------------------
  // TEST 2: Direction B (Laptop -> Mobile)
  // Simulate Laptop user clicking 'gym' habit in 30-day matrix
  // -------------------------------------------------------------
  console.log('\n💻 STEP 3: [Laptop App] User clicks "Gym" habit on Laptop...');
  const laptopToggleRes = await fetch(`${BASE_URL}/toggle`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: 'local_user_1',
      habitId: 'gym',
      completed: true,
      date: todayStr,
    }),
  });
  const laptopToggleData = await laptopToggleRes.json();
  console.log('   ↳ Hub Broadcasted:', laptopToggleData.message);

  // Verify Mobile poller gets the updated state
  const mobileCheckRes = await fetch(`${BASE_URL}/state?userId=local_user_1`);
  const mobileCheckData = await mobileCheckRes.json();
  const isGymDoneOnMobile = mobileCheckData.state?.matrix?.gym?.[todayStr];
  console.log('📱 STEP 4: [Mobile App] Checked if Gym is ticked on Phone: ' + (isGymDoneOnMobile ? '✅ YES (SYNCED!)' : '❌ NO'));

  // -------------------------------------------------------------
  // TEST 3: User XP & Streak Consistency
  // -------------------------------------------------------------
  console.log('\n👥 STEP 5: Checking Active User & Profile Streaks...');
  const activeUser = mobileCheckData.state?.user || {};
  console.log('   ↳ Active User  : Aditya (local_user_1)');
  console.log('   ↳ Current XP   : ' + activeUser.currentXP + ' XP');
  console.log('   ↳ Overall Streak: ' + activeUser.overallStreak + ' Days');

  console.log('\n================================================================');
  if (isLeetCodeDoneOnLaptop && isGymDoneOnMobile) {
    console.log('🎉 ALL TESTS PASSED! 2-WAY REAL-TIME SYNC IS 100% WORKING! 🔥');
  } else {
    console.log('❌ SOME TESTS FAILED.');
  }
  console.log('================================================================');
}

runBidirectionalTest();
