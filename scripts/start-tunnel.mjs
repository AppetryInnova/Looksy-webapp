import localtunnel from 'localtunnel';
import fs from 'fs';

async function startTunnel() {
  console.log('Starting tunnel...');
  try {
    const tunnel = await localtunnel({ port: 3000 });
    console.log('your url is:', tunnel.url);
    fs.writeFileSync('tunnel-url.txt', tunnel.url);
    
    tunnel.on('close', () => {
      console.log('Tunnel closed');
    });
  } catch (err) {
    console.error('Error starting tunnel:', err);
    fs.writeFileSync('tunnel-error.txt', err.message);
  }
}

startTunnel();
