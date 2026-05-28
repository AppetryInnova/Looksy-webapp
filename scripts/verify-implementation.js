// Native fetch used

async function verify() {
    const baseUrl = 'http://localhost:3000';
    console.log(`Verifying endpoints at ${baseUrl}...`);

    try {
        // 1. Verify Challenges
        console.log('\n--- Checking Challenges API ---');
        const challengesRes = await fetch(`${baseUrl}/api/challenges`);
        if (challengesRes.ok) {
            const challenges = await challengesRes.json();
            console.log(`✅ Challenges API returned ${challengesRes.status}:`, challenges.length, 'items');
            if (challenges.length > 0) {
                console.log('   Sample Challenge:', challenges[0].title);
            } else {
                console.warn('   ⚠️ No challenges returned.');
            }
        } else {
            console.error(`❌ Challenges API failed: ${challengesRes.status} ${challengesRes.statusText}`);
        }

        // 2. Verify Events (Listing)
        // Check if there's a route for GET /api/events. Assuming yes based on folder structure.
        console.log('\n--- Checking Events API ---');
        const eventsRes = await fetch(`${baseUrl}/api/events`);
        if (eventsRes.ok) {
            // It might return HTML if it's not an API route, or JSON.
            const contentType = eventsRes.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                const events = await eventsRes.json();
                console.log(`✅ Events API returned ${eventsRes.status}:`, events.length || 0, 'items');
            } else {
                console.log(`⚠️ Events endpoint returned non-JSON content (${contentType}). Likely a page route, skipping API check.`);
            }
        } else {
            // It's possible /api/events doesn't accept GET or is protected.
            console.log(`ℹ️ Events API check returned ${eventsRes.status} (Note: might need auth or different method)`);
        }

        // 3. Verify Profile API
        console.log('\n--- Checking Profile API ---');
        // Usually requires auth, so we expect a 401 or 403, which actually confirms the route exists/is protected.
        const profileRes = await fetch(`${baseUrl}/api/profile`);
        console.log(`ℹ️ Profile API returned ${profileRes.status} (Expected 401/403/500 if unauthenticated)`);

    } catch (error) {
        console.error('Verification failed:', error);
    }
}

verify();
