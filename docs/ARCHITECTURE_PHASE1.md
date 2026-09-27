# Phase 1 Architecture & Network Specifications
## Computer Networks Course Project — Private Network Service Platform

### 👥 Team Members & Machine Role Assignments

| Team Member Name | Machine Role | Services Managed | Assigned Ports |
| :--- | :--- | :--- | :--- |
| **Adnan Rizvi (2401010043)** (Lead) | System Architect & Edge/DNS Lead | `dnsmasq`, `Nginx`, Architecture | `Port 53 & 443` |
| **Team Member 2** | Edge Proxy & Load Balancer | `Nginx`, TLS SSL Engine | `Port 443 (HTTPS)` |
| **Team Member 3** | Dual Backend REST Microservices | Node.js Express Apps A & B | `Ports 3001 & 3002` |

---

### 1. Executive Summary & Topology Map
This document defines the Phase 1 build specifications for **CloudPulse**, a high-availability private network service platform deployed across a local area network (LAN).

```
                            [ Client Machine ]
                           (Mac 1 or Mac 4 Browser)
                                      │
              ┌───────────────────────┴───────────────────────┐
              │                                               │
              ▼                                               ▼
   [ Task B: Private DNS ]                        [ Task E: Edge Proxy ]
      Mac 1: Port 53                                 Mac 2: Port 443 (HTTPS)
   dnsmasq (app.team1.test)                         Nginx TLS Termination
              │                                               │
              └───────────────────────┬───────────────────────┘
                                      │
                     (Task D: Upstream Load Balancer)
                                      │
                      ┌───────────────┴───────────────┐
                      ▼                               ▼
            [ Mac 3: Backend A ]            [ Mac 4: Backend B ]
           Port 3001 (Node.js)             Port 3002 (Node.js)
           Header: X-Backend: A            Header: X-Backend: B
```

---

### 2. Machine Roles & IP Service Inventory

| Role Identifier | Machine Role | Services Running | Listening Interfaces & Ports | Cloud Equivalent |
| :--- | :--- | :--- | :--- | :--- |
| **Mac 1** | Private DNS Server & Client | `dnsmasq`, `dig`, `curl` | `0.0.0.0:53 (UDP/TCP)` | AWS Route 53 / Cloudflare DNS |
| **Mac 2** | Edge Reverse Proxy & Load Balancer | `Nginx`, TLS SSL Engine | `0.0.0.0:443 (HTTPS)`, `0.0.0.0:80` | AWS Application Load Balancer (ALB) |
| **Mac 3** | Backend Server A | Node.js Express REST API | `0.0.0.0:3001 (HTTP)` | EC2 / Compute Instance A |
| **Mac 4** | Backend Server B & Client | Node.js Express REST API | `0.0.0.0:3002 (HTTP)` | EC2 / Compute Instance B |

---

### 3. Complete Request & Protocol Journey (Layer-by-Layer)

1. **Layer 5 — DNS Resolution (UDP Port 53)**:
   - Client sends DNS query `A app.team1.test` to Mac 1 IP (`dnsmasq`).
   - Mac 1 responds with Mac 2 IPv4 address (`address=/app.team1.test/<Mac2_IP>`).

2. **Layer 4 — Transport Connection (TCP Port 443)**:
   - Client initiates TCP 3-Way Handshake with Mac 2: `SYN` ➔ `SYN-ACK` ➔ `ACK`.

3. **Layer 3 — Session & TLS Security Handshake**:
   - Client sends `ClientHello` supporting TLS 1.2 / TLS 1.3.
   - Mac 2 responds with `ServerHello`, SSL Certificate signed by Root CA, and `ServerKeyExchange`.
   - Symmetric session key negotiated; subsequent packets encrypted.

4. **Layer 2 — Application Layer & Load Balancing (HTTP/1.1 REST)**:
   - Client sends `GET /api/status HTTP/1.1` with `Host: app.team1.test`.
   - Mac 2 Nginx edge proxy evaluates `upstream backend_cluster` using Round-Robin algorithm.
   - Request proxied internally to Mac 3 (`3001`) or Mac 4 (`3002`).

5. **Layer 1 — Response & Caching Headers**:
   - Backend app injects `X-Backend: Server-A` (or `Server-B`) and `Cache-Control: max-age=60`.
   - Nginx relays payload back over encrypted TLS tunnel to client.

---

### 4. Mandatory Failure Scenarios & Diagnosis Guide

| Failure Scenario | How to Inject Fault | Expected Result & Observation | Root Cause Explanation |
| :--- | :--- | :--- | :--- |
| **1. Wrong DNS Server** | Set client DNS to `8.8.8.8` | `curl: (6) Could not resolve host: app.team1.test` | Public DNS servers do not know private `.test` TLDs. Shows DNS is decoupled from IP layer. |
| **2. One Backend Down** | Stop `node server.js` on Mac 3 | Client still receives 200 OK via Mac 4 | Nginx health checks detect `max_fails=2` on Port 3001 and route 100% traffic to Port 3002. |
| **3. Both Backends Down** | Stop `server.js` on Mac 3 & Mac 4 | Browser displays `502 Bad Gateway` | Edge proxy (Mac 2) is reachable over TLS, but upstream application layer is dead. |
| **4. Wrong Target Port** | `curl https://app.team1.test:8443` | `curl: (7) Failed to connect to port 8443: Connection refused` | IP routing succeeds, but no process is bound/listening on TCP port 8443. |
