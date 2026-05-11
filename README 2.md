# High-Performance API Gateway Service

A production-grade **Node.js + TypeScript API Gateway** built for modern microservice architectures. This project acts as a centralized entry point for backend services and demonstrates senior-level backend engineering concepts including authentication, authorization, distributed rate limiting, response caching, service routing, analytics persistence, observability, fault tolerance, and infrastructure automation.

---

## Live Project Summary

The API Gateway provides a secure and scalable layer between clients and internal microservices. Instead of exposing multiple backend services directly, all traffic flows through the gateway where common cross-cutting concerns are handled consistently.

This project is designed as a **Senior Backend Engineer portfolio project** and demonstrates practical system design, production readiness, clean architecture, observability, and DevOps awareness.

---

## Key Features

- Centralized API Gateway using **Express.js**
- Strict **TypeScript** architecture
- JWT access and refresh token authentication
- Role-Based Access Control using `admin`, `developer`, and `user` roles
- Redis-backed distributed sliding-window rate limiting
- Multi-layer response caching with in-memory and Redis cache
- Dynamic request routing to internal services
- Reverse proxy support for:
  - `/users/*`
  - `/payments/*`
  - `/analytics/*`
- Circuit breaker and timeout-ready architecture
- PostgreSQL analytics persistence
- Prometheus metrics endpoint
- Grafana dashboard provisioning
- Structured JSON logging with Pino
- Request IDs and correlation IDs
- Helmet, CORS, API key support, and IP whitelist middleware
- Nginx reverse proxy and SSL termination preparation
- Docker and Docker Compose infrastructure
- Jest and Supertest testing setup
- k6 load testing support
- GitHub Actions CI/CD workflow
- Graceful shutdown handling
- WebSocket gateway support preparation

---

## Tech Stack

| Category | Technology |
| --- | --- |
| Runtime | Node.js |
| Language | TypeScript |
| Server | Express.js |
| Authentication | JWT |
| Authorization | RBAC |
| Cache | In-memory cache, Redis |
| Rate Limiting | Redis sliding window |
| Database | PostgreSQL |
| Reverse Proxy | Nginx |
| Monitoring | Prometheus, Grafana |
| Logging | Pino |
| Testing | Jest, Supertest |
| Load Testing | k6 |
| Containerization | Docker, Docker Compose |
| CI/CD | GitHub Actions |

---

## Architecture Overview

```txt
Client
  |
  v
Nginx Reverse Proxy
  |
  v
API Gateway
  |
  |-- Security Middleware
  |-- Request ID / Correlation ID
  |-- JWT Authentication
  |-- RBAC Authorization
  |-- Redis Rate Limiting
  |-- Response Cache
  |-- Analytics Collector
  |-- Prometheus Metrics
  |
  +--> Users Service
  +--> Payments Service
  +--> Analytics Service
  |
  +--> Redis
  +--> PostgreSQL
  +--> Prometheus
  +--> Grafana
```

---

## Request Lifecycle

```txt
1. Client sends request
2. Nginx receives request and forwards it to the API Gateway
3. Gateway assigns request ID and correlation ID
4. Security middleware validates headers, CORS, API keys, and input
5. Rate limiter checks Redis sliding-window counters
6. JWT middleware validates the user where required
7. RBAC middleware validates user permissions
8. Cache middleware checks in-memory and Redis cache
9. Gateway routes request to the correct internal service
10. Response is transformed if needed
11. Analytics are stored in PostgreSQL
12. Metrics are exposed to Prometheus
13. Structured logs are written with Pino
14. Response returns to the client
```

---

## Folder Structure

```txt
src/
  analytics/
  auth/
  cache/
  config/
  gateway/
  middleware/
  monitoring/
  rate-limit/
  routes/
  services/
  types/
  utils/
scripts/
nginx/
prometheus/
grafana/
mock-services/
tests/
load-tests/
.github/workflows/
```

### Folder Explanation

| Folder | Purpose |
| --- | --- |
| `src/auth` | JWT authentication, refresh tokens, login/logout, RBAC |
| `src/cache` | In-memory and Redis response caching |
| `src/rate-limit` | Redis-backed sliding-window rate limiting |
| `src/gateway` | Dynamic proxy and routing logic |
| `src/middleware` | Security, request IDs, errors, validation |
| `src/analytics` | Request analytics and persistence |
| `src/monitoring` | Prometheus metrics |
| `src/config` | Environment, database, Redis, service registry |
| `src/utils` | Logger, errors, helpers |
| `mock-services` | Local services for gateway routing tests |
| `nginx` | Reverse proxy configuration |
| `prometheus` | Metrics scraping configuration |
| `grafana` | Dashboard provisioning |
| `tests` | Unit and integration tests |
| `load-tests` | k6 performance tests |

---

## Local Development Setup

### 1. Clone the repository

```bash
git clone <your-repository-url>
cd API-Gateway
```

### 2. Install dependencies

```bash
npm install
```

### 3. Create environment file

```bash
cp .env.example .env
```

If `.env.example` does not exist, create `.env` manually:

```env
NODE_ENV=development
PORT=4000
APP_NAME=high-performance-api-gateway
PUBLIC_BASE_URL=http://localhost:8080

JWT_ACCESS_SECRET=local-dev-access-secret-change-this
JWT_REFRESH_SECRET=local-dev-refresh-secret-change-this
ACCESS_TOKEN_TTL=15m
REFRESH_TOKEN_TTL=7d

REDIS_URL=redis://localhost:6379
DATABASE_URL=postgresql://gateway:gateway_password@localhost:5432/gateway_analytics

CORS_ORIGINS=http://localhost:3000,http://localhost:8080
API_KEYS=dev-api-key-1,dev-api-key-2
IP_WHITELIST=
LOG_LEVEL=info

CACHE_DEFAULT_TTL_SECONDS=60
CACHE_STALE_TTL_SECONDS=30

PUBLIC_RATE_LIMIT_PER_MINUTE=100
AUTH_RATE_LIMIT_PER_MINUTE=1000
REQUEST_TIMEOUT_MS=8000

USERS_SERVICE_URL=http://localhost:5001
PAYMENTS_SERVICE_URL=http://localhost:5002
ANALYTICS_SERVICE_URL=http://localhost:5003
```

### 4. Start Redis and PostgreSQL

```bash
docker compose up -d redis postgres
```

Confirm containers are healthy:

```bash
docker compose ps
```

You should see:

```txt
0.0.0.0:5432->5432/tcp
0.0.0.0:6379->6379/tcp
```

### 5. Run database migration

```bash
npm run db:migrate
```

### 6. Start development server

```bash
npm run dev
```

The gateway should start on:

```txt
http://localhost:4000
```

---

## Health Check

```bash
curl http://localhost:4000/health
```

Expected response:

```json
{
  "status": "ok",
  "redis": "ready",
  "postgres": "ok",
  "uptime": 32.87
}
```

---

## Authentication

### Login

```bash
curl -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"Password123!"}'
```

Expected response:

```json
{
  "accessToken": "jwt-access-token",
  "refreshToken": "jwt-refresh-token",
  "user": {
    "id": "1",
    "email": "admin@example.com",
    "role": "admin"
  }
}
```

### Refresh Token

```bash
curl -X POST http://localhost:4000/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"your-refresh-token"}'
```

### Logout

```bash
curl -X POST http://localhost:4000/auth/logout \
  -H "Authorization: Bearer your-access-token"
```

---

## RBAC Roles

| Role | Access Level |
| --- | --- |
| `admin` | Full access and unlimited rate limit |
| `developer` | Authenticated developer-level access |
| `user` | Standard authenticated user access |

RBAC ensures that route-level permissions are enforced centrally at the gateway layer.

---

## Rate Limiting Strategy

The gateway uses a Redis-backed sliding-window rate limiter.

### Limits

| User Type | Limit |
| --- | --- |
| Public API | 100 requests/minute |
| Authenticated users | 1000 requests/minute |
| Admin users | Unlimited |

### Why Sliding Window?

Sliding-window rate limiting is more accurate than fixed-window rate limiting because it prevents traffic bursts at window boundaries. It provides smoother request control and is better suited for distributed systems where multiple gateway instances may run behind a load balancer.

### Redis Optimization

Redis is used as shared state so rate limits work across multiple gateway instances. Keys are designed with TTLs to avoid unbounded memory growth.

Example key pattern:

```txt
rate-limit:user:{userId}
rate-limit:ip:{ipAddress}
```

---

## Caching Strategy

The gateway implements multi-layer caching:

1. **In-memory cache** for ultra-fast local access
2. **Redis cache** for distributed cache sharing across gateway instances

### Cache Features

- GET request caching
- TTL support
- Route-specific policies
- Cache key generation from method, URL, query, and user context
- Cache hit/miss metrics
- Stale-while-revalidate strategy preparation

### Cache Flow

```txt
Request
  |
  v
Check in-memory cache
  |
  +-- HIT --> return response
  |
  v
Check Redis cache
  |
  +-- HIT --> hydrate memory cache and return response
  |
  v
Forward request to upstream service
  |
  v
Store response in Redis and memory
```

---

## Request Routing

The gateway supports dynamic routing to internal services.

| Public Route | Internal Service |
| --- | --- |
| `/users/*` | Users Service |
| `/payments/*` | Payments Service |
| `/analytics/*` | Analytics Service |
| `/auth/*` | Gateway Auth Module |

The gateway forwards headers, preserves correlation IDs, propagates errors, and prepares the platform for service discovery or load balancing.

---

## Circuit Breaker and Fault Tolerance

The gateway is designed to protect the system from cascading failures.

Fault tolerance features include:

- Timeout handling
- Retry-ready service clients
- Circuit breaker preparation
- Fallback responses
- Health checks
- Upstream error propagation

This pattern prevents one failing microservice from degrading the entire platform.

---

## Monitoring

The gateway exposes Prometheus metrics at:

```txt
/metrics
```

Example:

```bash
curl http://localhost:4000/metrics
```

Tracked metrics include:

- Request count
- Request duration
- Error rate
- Cache hit rate
- Rate-limit violations
- Active users
- Top endpoints
- Upstream service latency

---

## Grafana

Grafana runs on:

```txt
http://localhost:3001
```

Default login:

```txt
Username: admin
Password: admin
```

Grafana is provisioned to read from Prometheus and visualize gateway performance.

---

## Nginx

Nginx acts as:

- Reverse proxy
- Compression layer
- SSL termination point
- Load-balancing entry point
- Public gateway interface

Run the full stack:

```bash
docker compose up --build
```

Test through Nginx:

```bash
curl http://localhost:8080/health
```

---

## Docker Services

| Service | Description |
| --- | --- |
| `api-gateway` | Main Node.js gateway |
| `redis` | Rate limiting and cache |
| `postgres` | Analytics persistence |
| `nginx` | Reverse proxy |
| `prometheus` | Metrics collection |
| `grafana` | Dashboards |
| `mock-users` | Mock users microservice |
| `mock-payments` | Mock payments microservice |
| `mock-analytics` | Mock analytics microservice |

---

## Docker Commands

Start database dependencies only:

```bash
docker compose up -d redis postgres
```

Start full infrastructure:

```bash
docker compose up --build
```

Stop infrastructure:

```bash
docker compose down
```

Remove volumes:

```bash
docker compose down -v
```

---

## Testing

Run tests:

```bash
npm test
```

Run tests in watch mode:

```bash
npm run test:watch
```

Run load test:

```bash
k6 run load-tests/gateway-load-test.js
```

Testing covers:

- Authentication flows
- Token refresh
- RBAC behavior
- Rate limiting
- Cache behavior
- Proxy routing
- Health checks
- Error handling

---

## CI/CD

The GitHub Actions workflow runs:

1. Install dependencies
2. Lint code
3. Run tests
4. Build TypeScript
5. Build Docker image
6. Prepare deployment

Recommended deployment environments:

- DigitalOcean Droplet
- AWS EC2
- Railway
- Render
- Kubernetes cluster

---

## Deployment Strategy

### Recommended Production Deployment

For a production-like deployment:

```txt
Nginx / Cloud Load Balancer
  |
  v
Multiple API Gateway containers
  |
  +--> Redis
  +--> PostgreSQL
  +--> Prometheus
  +--> Grafana
  +--> Internal services
```

### Production Secrets

Do not hardcode secrets. Use:

- Docker secrets
- GitHub Actions encrypted secrets
- AWS Secrets Manager
- Doppler
- Railway/Render environment variables

### Required Production Environment Variables

```env
NODE_ENV=production
PORT=4000
JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=
REDIS_URL=
DATABASE_URL=
CORS_ORIGINS=
API_KEYS=
LOG_LEVEL=info
```

---

## Security Considerations

Implemented:

- Helmet security headers
- CORS restrictions
- JWT verification
- Refresh token flow
- RBAC
- API key middleware
- IP whitelist middleware
- Input sanitization
- SQL injection prevention through parameterized queries
- Production-safe structured logs
- No sensitive token logging

Recommended production additions:

- Rotate JWT secrets regularly
- Store refresh tokens in hashed form
- Add device/session management
- Use HTTPS only
- Add WAF/CDN protection
- Add audit logs
- Add mTLS for internal service traffic

---

## Performance Targets

Target:

```txt
10,000+ requests per minute
```

Performance techniques:

- Redis-backed distributed rate limiting
- In-memory cache for hot responses
- Redis cache for shared cache state
- Lightweight Express middleware chain
- Structured async logging
- Prometheus metrics
- Gateway statelessness for horizontal scaling
- Nginx reverse proxy in front of Node.js
- Connection pooling for PostgreSQL

---

## Common Troubleshooting

### `.env.example: No such file or directory`

Create `.env` manually using the environment variables above.

### `JWT_ACCESS_SECRET received undefined`

Your `.env` file is missing required JWT secrets.

### `ECONNREFUSED 127.0.0.1:5432`

PostgreSQL is not exposed to your host machine. Make sure `docker-compose.yml` includes:

```yaml
ports:
  - "5432:5432"
```

### `EADDRINUSE: address already in use :::4000`

Another process is using port 4000.

```bash
kill -9 $(lsof -ti :4000)
```

### `/health` returns internal server error

Check middleware and database connectivity. In this project, replacing `express-mongo-sanitize` with a safe custom sanitizer fixes compatibility issues with newer Express behavior.

---

## Engineering Decisions

### Why Node.js and Express?

Node.js is efficient for I/O-heavy gateway workloads. Express keeps the architecture understandable while still allowing production-grade middleware composition.

### Why Redis?

Redis provides fast shared state for:

- Rate limiting
- Distributed caching
- Token/session-related features
- Future background queues

### Why PostgreSQL?

PostgreSQL is used for durable analytics persistence, allowing traffic analysis, endpoint reports, and historical system insights.

### Why Nginx?

Nginx provides a battle-tested public entry point for reverse proxying, compression, TLS termination, and load balancing.

### Why Prometheus and Grafana?

Prometheus and Grafana provide production-grade observability and make the system easier to operate, debug, and scale.

---

## Resume Bullet Points

- Designed and built a production-grade API Gateway using Node.js, TypeScript, Express, Redis, PostgreSQL, Docker, Nginx, Prometheus, and Grafana.
- Implemented JWT authentication, refresh tokens, RBAC, API key validation, IP whitelisting, and security middleware for centralized access control.
- Built Redis-backed sliding-window distributed rate limiting supporting per-IP and per-user limits for horizontally scalable gateway deployments.
- Developed multi-layer response caching with in-memory and Redis cache to reduce upstream load and improve latency.
- Integrated Prometheus metrics, Grafana dashboards, request correlation IDs, and structured JSON logging for production observability.
- Containerized the full infrastructure with Docker Compose, including gateway, Redis, PostgreSQL, Nginx, Prometheus, Grafana, and mock microservices.

---

## Interview Explanation

This project solves a common microservices problem: as systems grow, each service should not independently implement authentication, rate limiting, logging, caching, and observability. The API Gateway centralizes these cross-cutting concerns.

In an interview, explain it like this:

> I built a production-grade API Gateway that acts as the centralized entry point for a microservices architecture. It handles authentication, authorization, distributed Redis rate limiting, response caching, service routing, analytics persistence, metrics, logging, and reverse proxy integration. The gateway is stateless and horizontally scalable, with Redis used for shared distributed state and PostgreSQL used for durable analytics. I also containerized the full infrastructure using Docker Compose and added Prometheus/Grafana for observability.

---

## Author

**Olayenikan Michael**  
Full-Stack Software Engineer / Backend Engineer  
GitHub: https://github.com/poundsmichaelscode  
Portfolio: https://olayenikan-michael-software-enginee.vercel.app/  
LinkedIn: https://www.linkedin.com/in/olayenikan-michael/

---

## License

MIT License
