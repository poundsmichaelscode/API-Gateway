# High-Performance API Gateway Service

A production-grade API Gateway Service for microservice architectures, built with **Node.js, TypeScript, Express.js, Redis, PostgreSQL, Nginx, JWT, Prometheus, Grafana, Docker, and structured logging**.

This project is designed as a senior backend engineering portfolio system. It demonstrates gateway architecture, distributed rate limiting, multi-layer caching, service routing, monitoring, analytics persistence, security hardening, WebSocket support, CI/CD, and production deployment readiness.

---

## 1. System Architecture

### Why this matters

An API Gateway centralizes cross-cutting backend concerns so every downstream service does not need to re-implement authentication, authorization, rate limiting, observability, security, request tracing, and routing. This is how microservice platforms reduce duplication and improve control over traffic.

### Architecture

```mermaid
flowchart LR
  C[Client] --> N[Nginx Reverse Proxy]
  N --> G[API Gateway - Express + TypeScript]
  G --> A[Auth/RBAC]
  G --> R[Redis Rate Limit + Cache]
  G --> P[(PostgreSQL Analytics)]
  G --> M[Prometheus Metrics]
  M --> GR[Grafana Dashboard]
  G --> U[Users Service]
  G --> PAY[Payments Service]
  G --> AN[Analytics Service]
```

### Request lifecycle

```mermaid
sequenceDiagram
  participant Client
  participant Nginx
  participant Gateway
  participant Redis
  participant Postgres
  participant Service
  participant Prometheus

  Client->>Nginx: HTTP request
  Nginx->>Gateway: Forward with proxy headers
  Gateway->>Gateway: Request ID + correlation ID
  Gateway->>Gateway: Security middleware
  Gateway->>Gateway: JWT optional/required validation
  Gateway->>Redis: Sliding-window rate limit check
  Gateway->>Redis: Cache lookup for GET requests
  alt Cache hit
    Gateway-->>Client: Cached response
  else Cache miss
    Gateway->>Service: Proxy request
    Service-->>Gateway: Service response
    Gateway->>Redis: Store cache if eligible
    Gateway->>Postgres: Persist analytics event
    Gateway->>Prometheus: Expose metrics
    Gateway-->>Client: Response
  end
```

---

## 2. Folder Structure

```txt
src/
  analytics/      PostgreSQL analytics persistence and request tracking
  auth/           JWT, refresh tokens, seeded demo users, RBAC middleware
  cache/          In-memory + Redis cache with stale-while-revalidate support
  config/         Environment, Redis, and PostgreSQL configuration
  gateway/        Proxy and circuit breaker gateway primitives
  jobs/           Background analytics aggregation jobs
  middleware/     Error handling, metrics, security, request context
  monitoring/     Prometheus metric definitions
  rate-limit/     Redis sliding-window distributed rate limiter
  routes/         Health and monitoring routes
  security/       Reserved for future security modules
  services/       Service registry for downstream microservices
  types/          Express and package type declarations
  utils/          Logger, HTTP errors, async handler
  websocket/      WebSocket gateway support
nginx/            Reverse proxy, SSL terminator, load-balancer config
prometheus/       Prometheus scrape configuration
grafana/          Provisioned dashboards and datasource
k6/               Load testing scripts
tests/            Jest unit and integration tests
.github/          CI/CD workflow
mock-services/    Local mock microservices for users/payments/analytics
scripts/          DB migration/init scripts
```

---

## 3. Initial Setup

### Why this matters

Senior backend systems must start with strict typing, environment-driven configuration, testability, and predictable local startup.

### Requirements

- Node.js 22+
- Docker and Docker Compose
- Redis
- PostgreSQL
- k6, optional for load testing

### Run locally without Docker

```bash
cp .env.example .env
npm install
npm run db:migrate
npm run dev
```

The gateway runs on:

```txt
http://localhost:4000
```

Demo credentials:

```txt
admin@example.com / Password123!
developer@example.com / Password123!
user@example.com / Password123!
```

---

## 4. Docker Setup

### Why this matters

Docker gives the same runtime topology locally and in production: gateway, Redis, PostgreSQL, Nginx, Prometheus, Grafana, and mock services.

### Run the full stack

```bash
cp .env.example .env
docker compose up --build
```

Available services:

```txt
Gateway through Nginx: http://localhost:8080
Gateway direct internal port: api-gateway:4000
Prometheus: http://localhost:9090
Grafana: http://localhost:3001
Grafana login: admin / admin
```

### Health check

```bash
curl http://localhost:8080/health
```

---

## 5. Redis Integration

### Why this matters

Redis provides shared state across horizontally scaled gateway instances. Without Redis, rate limiting and cache state would be local to each container, allowing users to bypass limits by hitting different replicas.

### Redis responsibilities

- Refresh token session storage
- Sliding-window rate limiting
- Distributed response cache
- Cache invalidation by key pattern

### Redis architecture

```mermaid
flowchart TB
  G1[Gateway Replica 1] --> R[(Redis)]
  G2[Gateway Replica 2] --> R
  G3[Gateway Replica 3] --> R
  R --> RL[Rate Limit Sorted Sets]
  R --> C[Cache Records]
  R --> RT[Refresh Token State]
```

---

## 6. Authentication System

### Why this matters

The gateway is the centralized trust boundary. It validates access tokens before routing and forwards identity headers to downstream services.

### Features

- JWT access tokens
- Refresh tokens stored in Redis
- Logout token revocation
- RBAC roles: `admin`, `developer`, `user`
- Permission middleware

### Login

```bash
curl -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"Password123!"}'
```

### Refresh

```bash
curl -X POST http://localhost:8080/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"YOUR_REFRESH_TOKEN"}'
```

### Logout

```bash
curl -X POST http://localhost:8080/auth/logout \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"YOUR_REFRESH_TOKEN"}'
```

---

## 7. Rate Limiting

### Why this matters

Distributed rate limiting protects backend services from abuse, accidental traffic spikes, scraping, credential stuffing, and noisy tenants.

### Implementation

The project uses a Redis-backed sliding-window algorithm with sorted sets:

- Key format: `rl:scope:identifier`
- Each request inserts a timestamp into a sorted set
- Old timestamps outside the window are removed
- `ZCARD` gives the current request count
- TTL keeps memory bounded

### Limits

```txt
Public API: 100 requests/minute
Authenticated users: 1000 requests/minute
Admin users: unlimited
```

### Why sliding window is superior

Fixed windows can allow bursts at window boundaries. A user can send 100 requests at `12:00:59` and another 100 at `12:01:00`. Sliding windows calculate usage over the last real 60 seconds, producing smoother and fairer enforcement.

### Redis optimization strategy

- Use sorted sets only per active identity
- Remove old timestamps every request
- Expire keys slightly beyond the window
- Store minimal timestamp members
- Use Redis pipelines/multi commands to reduce round trips

---

## 8. Caching Layer

### Why this matters

Caching reduces downstream service load and improves latency for high-read endpoints.

### Multi-layer strategy

1. **In-memory LRU cache** for fastest repeated local hits
2. **Redis cache** for shared cache across replicas
3. **Stale-while-revalidate** support to avoid user-facing latency spikes

### Cache behavior

- Only GET requests are cached
- User-aware cache keys prevent data leakage
- Route-specific TTL policies are configured in the service registry
- Cache hit/miss metrics are exported to Prometheus

### Invalidate cache

```bash
curl -X POST http://localhost:8080/internal/cache/invalidate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -d '{"pattern":"cache:GET:/users*"}'
```

---

## 9. API Routing

### Why this matters

A gateway must route traffic dynamically while preserving headers, identity, observability context, and error semantics.

### Supported routes

```txt
/auth/*       Gateway authentication routes
/users/*      Proxied to users service
/payments/*   Proxied to payments service
/analytics/*  Proxied to analytics service
```

### Example proxied request

```bash
curl http://localhost:8080/users/profile \
  -H "x-api-key: dev-api-key-1"
```

### Service registry

Routing is configured in `src/services/serviceRegistry.ts`, making the gateway ready for future service discovery using Consul, Kubernetes DNS, AWS Cloud Map, or etcd.

---

## 10. Circuit Breaker

### Why this matters

Circuit breakers prevent cascading failures. If a downstream service is slow or failing, the gateway should stop overwhelming it and return a controlled fallback response.

### Included design

The project includes an `opossum`-based circuit breaker factory in `src/gateway/circuitBreaker.ts` with:

- Timeout handling
- Error threshold
- Half-open recovery
- Fallback responses
- Structured lifecycle logs

For the proxy layer, timeout and error propagation are enabled. In a production implementation, circuit breaker checks can be wrapped around service health probes or custom proxy dispatchers.

---

## 11. Monitoring

### Why this matters

A senior backend system must be measurable. You cannot scale, debug, or tune what you cannot observe.

### Metrics exposed at `/metrics`

- Requests per second
- Latency histogram
- Cache hits
- Cache misses
- Rate limit violations
- Proxy errors
- Active users gauge placeholder
- Node.js process metrics

### Prometheus

Prometheus scrapes the gateway every 10 seconds from:

```txt
http://api-gateway:4000/metrics
```

### Grafana dashboard

Grafana is provisioned automatically with panels for:

- Request rate
- p95 latency
- Cache hit rate
- Rate limit violations
- Proxy errors

Open:

```txt
http://localhost:3001
```

---

## 12. Logging

### Why this matters

Logs must support debugging across distributed systems. Request IDs and correlation IDs allow tracing a request across Nginx, gateway, and microservices.

### Logging features

- Pino JSON logs
- Request ID
- Correlation ID
- Redacted secrets
- Environment-based log levels
- Proxy response logs
- Error logs with stack traces in backend logs

### Example production log shape

```json
{
  "level": 30,
  "service": "high-performance-api-gateway",
  "requestId": "...",
  "correlationId": "...",
  "msg": "Proxy response"
}
```

---

## 13. Nginx Setup

### Why this matters

Nginx sits in front of the gateway to handle compression, TLS termination, basic edge-level rate limiting, connection tuning, and load balancing.

### Features

- Reverse proxy
- SSL termination template
- Gzip compression
- Least-connection upstream balancing
- WebSocket upgrade headers
- Production timeout tuning

### SSL setup

Place certificates here:

```txt
nginx/certs/fullchain.pem
nginx/certs/privkey.pem
```

Then update `server_name api.example.com` in `nginx/nginx.conf`.

For production, use Let's Encrypt with Certbot or a managed load balancer certificate.

---

## 14. Testing

### Why this matters

Gateway bugs can affect every service. Tests must verify authentication, rate limiting, caching, routing, and failure behavior.

### Run tests

```bash
npm test
```

### Test types included

- Unit tests for JWT token signing/verification
- Unit tests for cache key safety
- Integration test for login route
- k6 load test script

### Load test

```bash
k6 run k6/gateway-smoke.js
```

---

## 15. CI/CD

### Why this matters

A senior project should prove that it can be built, tested, containerized, and deployed predictably.

### GitHub Actions pipeline

The workflow in `.github/workflows/ci.yml` performs:

1. Checkout
2. Node.js setup
3. Dependency install
4. TypeScript build
5. Test run
6. Docker image build
7. Deployment placeholder for production environments

### Recommended production deployment flow

```txt
Pull request -> tests -> Docker build -> image scan -> push to registry -> deploy -> smoke test -> monitor
```

---

## 16. Deployment

### Docker Compose deployment on an EC2/DigitalOcean VM

```bash
sudo apt update
sudo apt install -y docker.io docker-compose-plugin git

git clone <your-repo-url>
cd high-performance-api-gateway
cp .env.example .env
nano .env

docker compose up -d --build
```

### Production environment variables

```txt
NODE_ENV=production
PORT=4000
JWT_ACCESS_SECRET=use-a-secret-manager
JWT_REFRESH_SECRET=use-a-secret-manager
REDIS_URL=redis://redis:6379
DATABASE_URL=postgresql://gateway:strong-password@postgres:5432/gateway_analytics
CORS_ORIGINS=https://yourfrontend.com
API_KEYS=rotated-production-api-keys
LOG_LEVEL=info
```

### Secrets strategy

Do not hardcode secrets. Use:

- AWS Secrets Manager
- Doppler
- Railway/Render secret variables
- DigitalOcean encrypted environment variables
- Kubernetes Secrets or External Secrets Operator

### Rollback strategy

- Tag every Docker image with Git SHA
- Keep the previous stable image available
- Run smoke tests after deployment
- Roll back by redeploying the previous image tag
- Use blue/green or canary deployments for higher-risk changes

---

## 17. README

This README is intentionally written as project documentation, system design notes, operational guide, and interview preparation material. It is structured to show senior-level thinking rather than only listing commands.

### API documentation summary

| Method | Route | Purpose |
|---|---|---|
| POST | `/auth/login` | Login and receive access/refresh tokens |
| POST | `/auth/refresh` | Refresh access token |
| POST | `/auth/logout` | Revoke refresh token |
| GET | `/health` | Health check |
| GET | `/ready` | Dependency readiness check |
| GET | `/metrics` | Prometheus metrics |
| POST | `/internal/cache/invalidate` | Admin/developer cache invalidation |
| GET | `/users/*` | Proxy to users service |
| POST | `/payments/*` | Proxy to payments service |
| GET | `/analytics/*` | Proxy to analytics service |
| WS | `/ws` | WebSocket gateway endpoint |

---

## 18. Scaling Strategy

### Target

The system is designed for **10,000+ requests per minute** with horizontal gateway scaling.

### Horizontal scaling

Run multiple gateway containers behind Nginx, Kubernetes Service, AWS ALB, or another load balancer. Redis keeps rate limit and cache state shared across replicas.

```mermaid
flowchart LR
  LB[Load Balancer] --> G1[Gateway 1]
  LB --> G2[Gateway 2]
  LB --> G3[Gateway 3]
  G1 --> R[(Redis Cluster)]
  G2 --> R
  G3 --> R
  G1 --> PG[(PostgreSQL)]
  G2 --> PG
  G3 --> PG
```

### Bottlenecks

- Redis hot keys for very high-traffic users
- PostgreSQL analytics write volume
- Large response payloads through proxy
- Cache stampedes
- Downstream service latency
- Nginx worker limits

### Optimization techniques

- Redis Cluster or managed Redis
- Batch analytics writes or move events to Kafka/NATS/SQS
- Tune Nginx worker connections
- Use compression carefully for large JSON responses
- Add cache request coalescing
- Use read replicas for analytics queries
- Apply service-specific circuit breakers
- Use Kubernetes HPA based on CPU, RPS, and latency

---

## 19. Interview Explanation Section

### How to explain this project

“I built a production-grade API Gateway in Node.js and TypeScript for microservice architectures. It centralizes authentication, RBAC, Redis-backed sliding-window rate limiting, multi-layer caching, request routing, analytics persistence, Prometheus metrics, Grafana dashboards, structured logging, Nginx reverse proxying, Docker deployment, and CI/CD. The design supports horizontal scaling because rate limits, cache, and sessions are externalized to Redis while analytics are persisted to PostgreSQL.”

### Strong interview talking points

- Why an API Gateway reduces duplicated middleware in microservices
- Why Redis is required for distributed rate limiting
- Why sliding-window limiting is fairer than fixed-window limiting
- How user-aware cache keys prevent data leakage
- How correlation IDs support distributed tracing
- How Nginx and the gateway divide responsibilities
- How Prometheus metrics expose latency, RPS, error rate, and cache hit rate
- How PostgreSQL stores durable analytics while Prometheus stores time-series metrics
- How circuit breakers protect the platform from cascading failures
- How the system can scale to multiple replicas safely

### Resume bullet examples

- Built a production-grade API Gateway with Node.js, TypeScript, Express, Redis, PostgreSQL, Nginx, Prometheus, and Grafana for centralized auth, routing, rate limiting, caching, and monitoring.
- Implemented Redis-backed sliding-window rate limiting supporting per-IP and per-user quotas with retry headers and role-based bypass for admin users.
- Designed multi-layer response caching using in-memory LRU and Redis with route-specific TTLs, stale-while-revalidate behavior, and Prometheus cache metrics.
- Integrated structured JSON logging, correlation IDs, analytics persistence, Docker Compose orchestration, and CI/CD workflows for production deployment readiness.

---

## Production Notes

This project is intentionally complete enough to run locally and demonstrate senior backend architecture. Before using it for a real production workload, add persistent user storage, rotate JWT signing keys, enforce HTTPS-only cookies if using browser sessions, add OpenTelemetry tracing, configure managed Redis/PostgreSQL, and use a production image registry.
