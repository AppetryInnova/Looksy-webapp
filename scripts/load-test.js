import http from 'k6/http';
import { check, sleep } from 'k6';

// Configuración del test: Simular 100 usuarios concurrentes durante 1 minuto
export const options = {
  stages: [
    { duration: '10s', target: 50 }, // Ramp up to 50 users
    { duration: '30s', target: 100 }, // Ramp up to 100 users
    { duration: '20s', target: 0 },  // Ramp down to 0
  ],
};

const BASE_URL = 'http://localhost:3000';

export default function () {
  // 1. Simular carga de la página principal
  const resHome = http.get(`${BASE_URL}/es`);
  check(resHome, {
    'homepage status is 200': (r) => r.status === 200,
  });

  sleep(1);

  // 2. Simular petición al feed social
  const resFeed = http.get(`${BASE_URL}/api/posts`);
  check(resFeed, {
    'feed api status is 200': (r) => r.status === 200,
  });

  sleep(2);
}
