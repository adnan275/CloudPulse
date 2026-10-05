# Phase 1 Architecture & Network Specifications
## Computer Networks Course Project — Private Network Service Platform

### 👥 Team Members & 3-Machine Deployment Mapping

> **Note on 3-Member Deployment Architecture:**  
> The course guidelines outline **4 distinct logical network roles** (Private DNS, Edge TLS Proxy, Backend A, Backend B). In our 3-member team deployment, **Node 1 (Private DNS :53)** and **Node 2 (Edge Proxy :443)** are consolidated on **Machine 1 (Team Lead)**, while **Machine 2** and **Machine 3** host the isolated upstream backend microservices (Server-A & Server-B). This provides full end-to-end network isolation, high availability, and redundancy across 3 physical devices.

| Team Member | Physical Machine | Logical Network Role(s) | Services Managed | Interfaces & Assigned Ports |
| :--- | :--- | :--- | :--- | :--- |
| **Adnan Rizvi (2401010043)** (Lead) | **Machine 1** | Node 1 (Private DNS) + Node 2 (Edge TLS Proxy) | `dnsmasq`, `Nginx` (TLS 1.3 Termination), System Architecture | `Port 53 (UDP)` & `Port 443 (HTTPS)` |
| **Praanshu Ranjan (2401010329)** | **Machine 2** | Node 3 (Upstream Backend A) | Node.js Express REST API (Server-A) | `Port 3001 (HTTP)` |
| **Aditya Pal (2401020082)** | **Machine 3** | Node 4 (Upstream Backend B) & Test Client | Node.js Express REST API (Server-B), `curl` | `Port 3002 (HTTP)` |

---

### 1. Executive Summary & Topology Map
This document defines the Phase 1 build specifications for **CloudPulse**, a high-availability private network service platform deployed across a local area network (LAN).

```
                            [ Client Machine ]
                     (Browser / curl / Test Runner)
                                   │
           ┌───────────────────────┴───────────────────────┐
           │                                               │
           ▼                                               ▼
[ Node 1: Private DNS ]                        [ Node 2: Edge Proxy ]
 Machine 1: Port 53                             Machine 1: Port 443 (HTTPS)
dnsmasq (app.team1.test)                       Nginx TLS Termination
           │                                               │
           └───────────────────────┬───────────────────────┘
                                   │
                  (Task D: Upstream Load Balancer)
                                   │
                   ┌───────────────┴───────────────┐
                   ▼                               ▼
        [ Node 3: Backend A ]            [ Node 4: Backend B ]
         Machine 2: Port 3001             Machine 3: Port 3002
         Header: X-Backend: A             Header: X-Backend: B
```

---

### 2. Logical Node Roles & IP Service Inventory

| Logical Node | Physical Host | Service Role | Services Running | Listening Interfaces & Ports | Cloud Equivalent |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Node 1** | Machine 1 (Adnan) | Authoritative Private DNS Server | `dnsmasq`, `dig`, query logging | `0.0.0.0:53 (UDP/TCP)` | AWS Route 53 / Cloudflare DNS |
| **Node 2** | Machine 1 (Adnan) | Edge Reverse Proxy & TLS Load Balancer | `Nginx`, TLS 1.3 SSL Engine | `0.0.0.0:443 (HTTPS)`, `0.0.0.0:80` | AWS Application Load Balancer (ALB) |
| **Node 3** | Machine 2 (Praanshu) | Upstream REST Microservice A | Node.js Express REST API | `0.0.0.0:3001 (HTTP)` | AWS EC2 Compute Instance A |
| **Node 4** | Machine 3 (Garariya) | Upstream REST Microservice B & Test Client | Node.js Express REST API, `curl` | `0.0.0.0:3002 (HTTP)` | AWS EC2 Compute Instance B |

---

### 3. Complete Request & Protocol Journey (Layer-by-Layer)

1. **Layer 5 — DNS Resolution (UDP Port 53)**:
   - Client sends DNS query `A app.team1.test` to Machine 1 IP (`dnsmasq`).
   - Node 1 responds with Machine 1 IPv4 address (`address=/app.team1.test/<Machine1_IP>`).

2. **Layer 4 — Transport Connection (TCP Port 443)**:
   - Client initiates TCP 3-Way Handshake with Machine 1: `SYN` ➔ `SYN-ACK` ➔ `ACK`.

3. **Layer 3 — Session & TLS Security Handshake**:
   - Client sends `ClientHello` supporting TLS 1.2 / TLS 1.3.
   - Machine 1 responds with `ServerHello`, SSL Certificate signed by Root CA, and `ServerKeyExchange`.
   - Symmetric session key negotiated; subsequent packets encrypted.

4. **Layer 2 — Application Layer & Load Balancing (HTTP/1.1 REST)**:
   - Client sends `GET /api/status HTTP/1.1` with `Host: app.team1.test`.
   - Machine 1 Nginx edge proxy evaluates `upstream backend_cluster` using Round-Robin algorithm.
   - Request proxied internally over LAN to Machine 2 (`3001`) or Machine 3 (`3002`).

5. **Layer 1 — Response & Caching Headers**:
   - Backend app injects `X-Backend: Server-A` (or `Server-B`) and `Cache-Control: max-age=60`.
   - Nginx relays payload back over encrypted TLS tunnel to client.

---

### 4. Mandatory Failure Scenarios & Diagnosis Guide

| Failure Scenario | How to Inject Fault | Expected Result & Observation | Root Cause Explanation |
| :--- | :--- | :--- | :--- |
| **1. Wrong DNS Server** | Set client DNS to `8.8.8.8` | `curl: (6) Could not resolve host: app.team1.test` | Public DNS servers do not know private `.test` TLDs. Shows DNS is decoupled from IP layer. |
| **2. One Backend Down** | Stop `node server.js` on Machine 2 (Node 3) | Client still receives 200 OK via Machine 3 (Node 4) | Nginx health checks detect `max_fails=2` on Port 3001 and route 100% traffic to Port 3002. |
| **3. Both Backends Down** | Stop `server.js` on Machine 2 & Machine 3 | Browser displays `502 Bad Gateway` | Edge proxy (Machine 1) is reachable over TLS, but upstream application layer is dead. |
| **4. Wrong Target Port** | `curl https://app.team1.test:8443` | `curl: (7) Failed to connect to port 8443: Connection refused` | IP routing succeeds, but no process is bound/listening on TCP port 8443. |
