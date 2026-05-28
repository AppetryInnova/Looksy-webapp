async function verifyStores() {
    try {
        const res = await fetch('http://localhost:3000/api/stores?lat=-34.6037&lng=-58.3816');
        if (res.ok) {
            const data = await res.json();
            console.log('Stores found:', data.length);
            console.log('First store:', data[0]?.name);
        } else {
            console.log('Error:', res.status);
        }
    } catch (e) {
        console.error(e);
    }
}
verifyStores();
