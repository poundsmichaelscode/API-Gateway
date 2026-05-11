# Case Study: High-Performance API Gateway Service

## Project Title

**High-Performance API Gateway Service**

## Role

Senior Backend Architect / Staff-Level Node.js Engineer

## Project Type

Backend Infrastructure, Microservices Gateway, DevOps, Observability, Security

---

## Executive Summary

High-Performance API Gateway Service is a production-grade backend infrastructure project designed to serve as the centralized entry point for a microservices system.

The gateway consolidates core backend responsibilities such as authentication, authorization, distributed rate limiting, response caching, request routing, observability, logging, analytics persistence, and security hardening.

The project was built to demonstrate senior-level backend engineering skills and system design thinking. It shows how an engineering team can reduce duplicated logic across services, improve security, enforce consistent traffic policies, and create a more observable microservices architecture.

---

## Problem Statement

In a microservices architecture, backend teams often face repeated implementation of the same cross-cutting concerns across multiple services:

- Authentication logic repeated in every service
- Inconsistent authorization rules
- No centralized rate limiting
- Poor visibility into request traffic
- Difficult debugging across distributed services
- Inconsistent logging formats
- No unified caching strategy
- Internal services exposed too directly
- Increased risk of cascading failures

As the number of services grows, this creates operational complexity, security risks, and poor developer experience.

---

## Goal

The goal was to build a scalable API Gateway that can:

1. Receive all external API traffic
2. Authenticate and authorize requests centrally
3. Enforce distributed rate limits using Redis
4. Cache eligible responses
5. Route traffic to internal services
6. Collect analytics in PostgreSQL
7. Expose Prometheus metrics
8. Support Grafana dashboards
9. Add production-grade logging and request tracing
10. Run locally and in production using Docker and Nginx

---

## Solution Overview

The solution is a Node.js + TypeScript API Gateway built with Express.js. It sits in front of internal services and applies a consistent request pipeline.

The gateway handles:

- Security middleware
- JWT access tokens
- Refresh tokens
- Role-based access control
- API key validation
- IP whitelist support
- Redis rate limiting
- Response caching
- Request proxying
- Metrics collection
- Analytics persistence
- Structured JSON logging
- Request ID and correlation ID propagation

The infrastructure is containerized with Docker Compose and includes Redis, PostgreSQL, Nginx, Prometheus, Grafana, and mock services for local development.

---

## System Architecture

```txt
External Client
  |
  v
Nginx Reverse Proxy
  |
  v
API Gateway Service
  |
  |-- Request ID Middleware
  |-- Security Middleware
  |-- Authentication Middleware
  |-- RBAC Middleware
  |-- Rate Limiting Middleware
  |-- Cache Middleware
  |-- Analytics Middleware
  |-- Metrics Middleware
  |
  +--> Users Microservice
  +--> Payments Microservice
  +--> Analytics Microservice
  |
  +--> Redis
  +--> PostgreSQL
  +--> Prometheus
  +--> Grafana
```

---

## Why an API Gateway?

An API Gateway is valuable because it centralizes shared backend concerns. Instead of forcing every service to implement authentication, security, rate limiting, observability, and request logging independently, the gateway provides one reliable layer.

This improves:

- Security
- Maintainability
- Performance
- Developer productivity
- Observability
- Operational control
- Scalability

---

## Core Engineering Decisions

### 1. Node.js + TypeScript

Node.js is well-suited for I/O-heavy gateway workloads because gateway services spend most of their time handling network requests, waiting for Redis, proxying traffic, or reading/writing logs.

TypeScript was used to improve maintainability, reduce runtime errors, and make the codebase easier to scale.

### 2. Express.js

Express was selected because it is mature, widely used, and easy to compose with custom middleware. It allows the request lifecycle to be clearly structured.

### 3. Redis for Distributed State

Redis powers two critical gateway capabilities:

- Rate limiting
- Shared response caching

Because Redis is external to the gateway process, multiple gateway instances can share the same state. This allows horizontal scaling.

### 4. PostgreSQL for Analytics

PostgreSQL stores durable analytics such as request counts, latency, endpoint usage, and error data. This allows future reporting and dashboarding beyond short-term Prometheus metrics.

### 5. Prometheus + Grafana

Prometheus collects metrics from the gateway, while Grafana visualizes operational health.

This gives the project production-grade observability.

### 6. Nginx

Nginx is placed in front of the gateway to prepare the system for real-world production deployment. It can handle compression, SSL termination, reverse proxying, and load balancing.

---

## Authentication and Authorization

The gateway implements JWT authentication using access and refresh tokens.

### Authentication Flow

```txt
User logs in
  |
  v
Gateway validates credentials
  |
  v
Gateway issues access token and refresh token
  |
  v
Client sends access token with protected requests
  |
  v
Gateway validates token and attaches user to request
  |
  v
RBAC middleware checks role permissions
```

### Roles

| Role | Description |
| --- | --- |
| `admin` | Full access and unlimited rate limiting |
| `developer` | Authenticated developer access |
| `user` | Standard authenticated access |

Centralized RBAC ensures internal services do not need to duplicate permission logic.

---

## Distributed Rate Limiting

The gateway implements Redis-backed sliding-window rate limiting.

### Why Sliding Window?

A fixed-window limiter can allow traffic bursts at the boundary between two time windows. For example, a user could send 100 requests at the end of one minute and another 100 at the start of the next minute.

A sliding-window algorithm smooths traffic and provides more accurate enforcement.

### Limits

| Traffic Type | Limit |
| --- | --- |
| Public requests | 100 requests per minute |
| Authenticated users | 1000 requests per minute |
| Admin users | Unlimited |

### Distributed Benefit

Because Redis stores the counters, every gateway instance sees the same rate-limit state. This makes the limiter safe for horizontal scaling.

---

## Caching Layer

The gateway uses a two-level cache design:

1. In-memory cache for fastest access
2. Redis cache for shared distributed cache

### Why Two-Level Caching?

In-memory cache is extremely fast but only local to one gateway instance. Redis cache is slightly slower but shared across all instances.

Using both gives:

- Faster responses
- Reduced service load
- Lower upstream latency
- Better horizontal scalability

### Cache Flow

```txt
GET Request
  |
  v
Check memory cache
  |
  +-- Hit --> Return cached response
  |
  v
Check Redis cache
  |
  +-- Hit --> Return cached response and hydrate memory
  |
  v
Proxy to upstream service
  |
  v
Store response in memory and Redis
```

---

## Request Routing

The gateway routes public paths to internal services.

| Public Route | Internal Destination |
| --- | --- |
| `/users/*` | Users Service |
| `/payments/*` | Payments Service |
| `/analytics/*` | Analytics Service |
| `/auth/*` | Gateway Auth Module |

This creates a clean separation between public API contracts and internal service locations.

---

## Fault Tolerance

The gateway was designed with fault tolerance in mind.

Implemented or prepared features include:

- Request timeout handling
- Circuit breaker pattern readiness
- Health checks
- Graceful shutdown
- Upstream error propagation
- Fallback response strategy

This reduces the risk of cascading failures when an internal service becomes slow or unavailable.

---

## Observability

Observability was a major design goal.

The gateway includes:

- Structured JSON logs
- Request IDs
- Correlation IDs
- Prometheus metrics
- Grafana dashboards
- Health checks
- Request latency tracking
- Cache hit/miss tracking
- Rate-limit violation tracking
- Error rate tracking

This makes the system easier to debug and operate.

---

## Logging Strategy

The project uses structured logging with Pino.

Each request can be traced using:

- Request ID
- Correlation ID
- HTTP method
- Route
- Status code
- Latency
- User context where available

Structured logs are preferred in production because they are easier to search, filter, and ingest into tools like Datadog, Loki, ELK, or CloudWatch.

---

## Security Hardening

The gateway includes multiple security protections:

- Helmet security headers
- CORS restrictions
- API key middleware
- IP whitelist middleware
- JWT validation
- RBAC
- Input sanitization
- SQL injection prevention through parameterized queries
- Safe error handling
- No sensitive token logging

During local testing, an issue was discovered with `express-mongo-sanitize`, which caused internal server errors because of compatibility problems with newer Express request objects. The middleware was replaced with a custom sanitizer that safely removes dangerous object keys from request body and params without mutating read-only request properties.

---

## Deployment Architecture

### Local Development

```txt
Local Node.js Gateway
  |
  +--> Docker Redis
  +--> Docker PostgreSQL
```

### Full Docker Development

```txt
Docker Compose
  |
  +--> api-gateway
  +--> redis
  +--> postgres
  +--> nginx
  +--> prometheus
  +--> grafana
  +--> mock-users
  +--> mock-payments
  +--> mock-analytics
```

### Production Deployment

```txt
Cloud Load Balancer
  |
  v
Nginx
  |
  v
API Gateway replicas
  |
  +--> Redis
  +--> PostgreSQL
  +--> Internal services
  +--> Monitoring stack
```

---

## Local Development Challenges Solved

### Challenge 1: Missing `.env.example`

The project initially failed because required environment variables were missing.

Error:

```txt
JWT_ACCESS_SECRET expected string, received undefined
JWT_REFRESH_SECRET expected string, received undefined
```

Solution:

A valid `.env` file was created with JWT secrets, Redis URL, PostgreSQL URL, service URLs, and gateway configuration.

### Challenge 2: Node Version Compatibility

The system initially used Node v25, while some packages required Node 20, 22, or 24.

Solution:

Node 22 was installed and linked successfully using Homebrew.

### Challenge 3: PostgreSQL Port Not Exposed

PostgreSQL was healthy inside Docker, but local Node could not connect because the port was not exposed to the host.

Error:

```txt
ECONNREFUSED 127.0.0.1:5432
```

Solution:

Docker Compose was updated with:

```yaml
ports:
  - "5432:5432"
```

Redis was also exposed:

```yaml
ports:
  - "6379:6379"
```

### Challenge 4: Port 4000 Already in Use

The gateway failed to restart because another Node process was already listening on port 4000.

Solution:

The process was killed using:

```bash
kill -9 $(lsof -ti :4000)
```

### Challenge 5: Internal Server Error on `/health` and `/auth/login`

The gateway started, but requests returned internal server errors.

Root cause:

`express-mongo-sanitize` caused compatibility issues by trying to mutate request properties that are read-only in newer Express versions.

Solution:

The package was replaced with a custom input sanitization middleware.

Final verification:

```json
{
  "status": "ok",
  "redis": "ready",
  "postgres": "ok"
}
```

Login also returned valid access and refresh tokens.

---

## Final Working Result

The gateway successfully runs locally on:

```txt
http://localhost:4000
```

Health check response:

```json
{
  "status": "ok",
  "redis": "ready",
  "postgres": "ok",
  "uptime": 32.87
}
```

Login response includes:

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

---

## Performance and Scalability

The gateway is designed for high-throughput workloads.

### Target

```txt
10,000+ requests per minute
```

### Scaling Strategy

The gateway is stateless, so it can be horizontally scaled by running multiple instances behind Nginx or a cloud load balancer.

Redis provides shared distributed state for:

- Rate limiting
- Cache
- Future session/token features

PostgreSQL provides durable persistence for analytics.

### Bottlenecks

Potential bottlenecks include:

- Redis latency under high request volume
- PostgreSQL analytics write pressure
- Upstream service latency
- Large response payloads
- Excessive synchronous middleware logic
- Logging volume under high traffic

### Optimization Techniques

- Batch analytics writes
- Use Redis pipelining
- Cache hot GET responses
- Use connection pooling
- Keep gateway stateless
- Add horizontal replicas
- Use Nginx compression
- Tune Node.js memory limits
- Monitor event-loop delay
- Move heavy aggregation into background jobs

---

## Business Impact

This project improves a microservices platform by:

- Reducing duplicated code across services
- Improving security and access control
- Protecting services from traffic spikes
- Reducing latency with caching
- Improving operational visibility
- Making traffic easier to monitor and debug
- Preparing the system for horizontal scaling
- Improving developer productivity

---

## What This Project Demonstrates

This project demonstrates strong backend engineering skills in:

- Microservices architecture
- API gateway design
- Node.js and TypeScript
- Express middleware architecture
- JWT authentication
- RBAC authorization
- Redis distributed systems patterns
- Caching strategy
- Rate limiting algorithms
- PostgreSQL persistence
- Docker infrastructure
- Nginx reverse proxying
- Prometheus and Grafana observability
- Structured logging
- CI/CD readiness
- Production troubleshooting
- Security hardening

---

## Resume Summary

**High-Performance API Gateway Service** — Designed and implemented a production-grade API Gateway using Node.js, TypeScript, Express, Redis, PostgreSQL, Docker, Nginx, Prometheus, and Grafana. Built centralized JWT authentication, RBAC, distributed sliding-window rate limiting, multi-layer caching, dynamic service routing, structured logging, analytics persistence, and observability tooling for a scalable microservices architecture.

---

## Interview Talking Points

### How would you explain this project?

I built a production-grade API Gateway for a microservices architecture. The gateway acts as the centralized entry point for client traffic and handles authentication, authorization, distributed rate limiting, caching, routing, analytics, monitoring, and logging. It uses Redis for shared distributed state, PostgreSQL for analytics persistence, Prometheus and Grafana for observability, and Nginx as a reverse proxy. The system is containerized with Docker Compose and designed to scale horizontally.

### Why is Redis important here?

Redis provides fast shared state across multiple gateway instances. Without Redis, rate limiting and caching would only work per process. With Redis, all gateway replicas enforce the same limits and share cached responses.

### Why is the gateway stateless?

A stateless gateway can be horizontally scaled easily. Any request can go to any instance because shared state is stored externally in Redis and PostgreSQL.

### How would you scale this in production?

I would run multiple API Gateway containers behind Nginx or a cloud load balancer, use managed Redis and PostgreSQL, enable autoscaling, move analytics aggregation to background jobs, and monitor latency, error rate, cache hit rate, and Redis/Postgres performance.

### What was the most important debugging lesson?

A running server does not mean the request pipeline is healthy. The gateway started correctly, but middleware caused internal server errors. Debugging required isolating the middleware chain, checking logs, verifying dependencies, and replacing incompatible sanitization logic with a safer custom implementation.

---

## Screenshots to Add to Portfolio

Recommended screenshots:

1. Terminal showing successful `/health` response
2. Terminal showing login response with JWT tokens
3. Docker Compose running services
4. Prometheus metrics page
5. Grafana dashboard
6. Project folder structure
7. Nginx gateway request through `localhost:8080`

---

## Portfolio Description

High-Performance API Gateway Service is a backend infrastructure project that demonstrates how to build a scalable gateway for microservices. It centralizes authentication, authorization, rate limiting, caching, request routing, analytics, logging, and monitoring. The system uses Node.js, TypeScript, Redis, PostgreSQL, Docker, Nginx, Prometheus, and Grafana, making it a strong production-grade backend portfolio project.

---

## Author

**Olayenikan Michael**  
Full-Stack Software Engineer / Backend Engineer  
GitHub: https://github.com/poundsmichaelscode  
Portfolio: https://olayenikan-michael-software-enginee.vercel.app/  
LinkedIn: https://www.linkedin.com/in/olayenikan-michael/
