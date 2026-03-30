# Distributed Job Queue System

A production-grade distributed job processing system built with Node.js, TypeScript, Redis, and PostgreSQL. Deployed on AWS with automated CI/CD.

**Live Demo:** http://40.192.92.168:3000

---

## What This Project Demonstrates

This project showcases core distributed systems concepts:

- Asynchronous job processing — API accepts work and returns instantly, background workers process independently
- Producer/Consumer pattern — decoupled API and worker processes communicating via Redis queue
- Fault tolerance — automatic retries with exponential backoff, Dead Letter Queue for exhausted jobs
- Horizontal scaling — multiple worker instances consuming from the same queue, Redis handles distribution
- Observability — structured JSON logging, metrics endpoint, health checks
- Job scheduling — delayed job execution using queue-level scheduling

---

## Architecture

```
Client → Fastify API → Redis (BullMQ) → Worker → PostgreSQL
                    ↓
              PostgreSQL (job state)
```

**Infrastructure:**

- EC2 t2.micro — API server + React dashboard (PM2)
- EC2 t2.micro — BullMQ worker + Redis in Docker (PM2)
- RDS t2.micro — PostgreSQL (managed)
- GitHub Actions — auto-deploy on push to main (~25 seconds)

---

## API Endpoints

| Method | Endpoint        | Description                                    |
| ------ | --------------- | ---------------------------------------------- |
| POST   | /jobs           | Submit a job                                   |
| GET    | /jobs           | List jobs with status/type filters             |
| GET    | /jobs/:id       | Get full job details                           |
| POST   | /jobs/:id/retry | Re-queue a dead job                            |
| GET    | /metrics        | Queue depth, success rate, avg processing time |
| GET    | /health         | Database + Redis connectivity status           |

---

## Job Types

| Type                | Status      | Description                                      |
| ------------------- | ----------- | ------------------------------------------------ |
| `send_email`        | Implemented | Sends real email via Gmail SMTP using Nodemailer |
| `generate_report`   | Simulated   | Demonstrates job lifecycle with artificial delay |
| `resize_image`      | Simulated   | Shows retry and failure handling                 |
| `send_notification` | Simulated   | Shows Dead Letter Queue behavior                 |

> Simulated job types intentionally fail at a configurable rate to demonstrate retry mechanism and DLQ behavior. Real implementations would replace the handler with actual business logic.

---

## Key System Behaviors

**Retry with exponential backoff:**

```
Attempt 1 fails → wait 3s → Attempt 2 fails → wait 9s → Attempt 3 fails → DEAD
```

**Dead Letter Queue:**
Jobs that exhaust all retry attempts move to `DEAD` status with the exact error message stored. Can be re-queued via `POST /jobs/:id/retry`.

**Job Scheduling:**

```json
POST /jobs
{
  "type": "send_email",
  "payload": { "to": "user@example.com" },
  "delay": 30000
}
```

Job sits in queue for 30 seconds then processes automatically.

**Distributed workers:**
Run multiple worker instances pointing at the same Redis queue. Each job goes to exactly one worker — Redis handles distribution automatically.

---

## Tech Stack

| Layer      | Technology              |
| ---------- | ----------------------- |
| Runtime    | Node.js 20 + TypeScript |
| API        | Fastify                 |
| Queue      | Redis + BullMQ          |
| ORM        | Prisma                  |
| Database   | PostgreSQL              |
| Logging    | Pino (structured JSON)  |
| Frontend   | React + Vite            |
| Deployment | AWS EC2 + RDS           |
| CI/CD      | GitHub Actions          |
| Local dev  | Docker Compose          |

---

## Local Development

```bash
# Clone the repo
git clone https://github.com/nagaladinnemahesh/distributed-job-queue.git
cd distributed-job-queue

# Start full stack with Docker Compose
docker compose up

# Dashboard
cd dashboard && npm install && npm run dev
# Open http://localhost:5173
```

Environment variables needed — see `.env.example`.

---

## CI/CD Pipeline

```
git push origin main
       ↓
GitHub Actions
       ↓
SSH into API EC2 → git pull → npm install → build dashboard → pm2 restart
SSH into Worker EC2 → git pull → npm install → pm2 restart
       ↓
Live in ~21 seconds
```

---

## What I Would Add Next

- Priority queues — high priority jobs jump ahead in the queue
- Grafana dashboard — visualize queue metrics over time
- HTTPS with Let's Encrypt — SSL certificate on a custom domain
- Rate limiting — prevent queue flooding
- Job cancellation — cancel PENDING/SCHEDULED jobs via API
- Webhook notifications — notify external services on job completion
