# Argos Security Scanner

Argos is a security scanning platform designed to automate web application assessment through a scalable worker-based architecture.

The platform coordinates multiple security tools, manages scan execution lifecycles, normalizes findings, and provides a structured workflow for vulnerability discovery and reporting.

## Project Status

🚧 Currently under active development

Core architecture, database design, scan lifecycle management, and worker orchestration are being implemented.

## Goals

Argos aims to provide:

- Centralized vulnerability scanning
- Automated security assessment workflows
- Scan lifecycle tracking
- Normalized vulnerability reporting
- Multi-tool orchestration
- Ownership verification for scanned assets
- Scalable background processing

## Architecture Overview

The platform separates responsibilities between API services and background workers.

### API Server

Responsible for:

- User management
- Target registration
- Ownership verification
- Scan creation
- Status tracking
- Result retrieval

### Worker Service

Responsible for:

- Polling queued scans
- Locking jobs
- Executing scanners
- Tracking tool execution
- Processing findings
- Updating scan state

### Scan Lifecycle

```text
queued → running → finished
       ↘ failed
       ↘ canceled
```

Scans are immutable records:

- Results remain available permanently
- Status moves only forward
- Audit history is preserved

## Supported Scan Types

### Passive Scan

- No attack traffic
- Response observation only
- Minimal legal risk
- Suitable for monitoring

### Active Scan

- Controlled testing
- Input validation checks
- Rate-limited scanning
- Pre-production assessment

### Full Scan

- Active testing
- Network discovery
- Directory fuzzing
- Comprehensive assessment

## Security Tools

Planned integrations include:

- OWASP ZAP
- Nmap
- Nikto
- FFUF

Each tool execution is tracked independently and associated with the parent scan.

## Data Architecture

### PostgreSQL

Stores:

- Users
- Targets
- Scan jobs
- Tool execution status
- Normalized vulnerabilities

### MongoDB

Stores:

- Raw scanner outputs
- Tool-specific JSON results
- Historical scan artifacts

## Technology Stack

### Backend

- Node.js
- TypeScript
- Express.js

### Databases

- PostgreSQL
- MongoDB

### Infrastructure

- Docker
- Docker Compose

### Security

- OWASP ZAP
- Nmap
- Nikto
- FFUF

## Key Engineering Concepts

- Worker-based job processing
- Queue-driven architecture
- Scan lifecycle management
- Vulnerability normalization
- Ownership verification
- Multi-database architecture
- Security automation workflows

## Roadmap

### Phase 1

- User management
- Target verification
- Scan lifecycle
- Worker orchestration

### Phase 2

- Tool integrations
- Vulnerability normalization
- Reporting engine

### Phase 3

- Dashboards
- Scheduling
- Notifications
- Team collaboration

## Author

Wseem Kharma

Full-Stack Engineer focused on SaaS platforms, backend systems, cloud architecture, and application security.
