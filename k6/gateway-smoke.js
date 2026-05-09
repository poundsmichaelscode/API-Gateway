import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 25,
  duration: '30s',
  thresholds: {
    http_req_failed: ['rate<0.05'],
    http_req_duration: ['p(95)<500']
  }
};

export default function () {
  const res = http.get('http://localhost:8080/users/profile', { headers: { 'x-api-key': 'dev-api-key-1' } });
  check(res, { 'status is 200 or 401': (r) => [200, 401].includes(r.status) });
  sleep(1);
}
