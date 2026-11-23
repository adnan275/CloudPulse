# Project Report: CloudPulse
**Computer Networks Course Project — High-Availability Distributed Private Network Platform**

---

## 1. Project Metadata & Team Identification

- **Project Title:** CloudPulse — Distributed Private Network Service Platform
- **Scope:** Complete System Architecture & Implementation Report
- **Infrastructure Category:** Type 2 — 3 Physical Machines with Consolidated Gateway Roles
- **Target Domain:** `app.team1.test` / `api.team1.test`
- **Subnet Configuration:** `192.168.1.0/24` (Private Local Area Network)
- **Repository:** [https://github.com/adnan275/CloudPulse](https://github.com/adnan275/CloudPulse)

### Team Contributors & Role Matrix

| Team Member | Enrollment No. | Physical Host | Architectural Role | Core Technical Ownership |
| :--- | :--- | :--- | :--- | :--- |
| **Adnan Rizvi** (Lead) | `2401010043` | Machine 1 (`192.168.1.50`) | Principal Infrastructure Architect | Private LAN Design, NGINX Edge Reverse Proxy, TLS 1.3 Termination, Layer 7 Load Balancing |
| **Praanshu Ranjan** | `2401010329` | Machine 2 (`192.168.1.51`) | Backend Systems Engineer | Upstream Microservice A (`:3001`), REST Routing, `X-Backend: Server-A` Injection |
| **Aditya Pal** | `2401020082` | Machine 3 (`192.168.1.52`) | DNS & Protocol Engineer | Authoritative DNS (`dnsmasq` :53), Upstream Microservice B (`:3002`), HTTP 304 Caching, Wireshark Protocol Analysis |

---

## 2. Executive Summary

CloudPulse is a production-grade simulation of modern cloud edge architecture deployed across an isolated physical Local Area Network (LAN). The system models the lifecycle of client-server communication across all major OSI and TCP/IP protocol layers:

1. **Application Layer (L7):** HTTP/1.1 REST microservices with dynamic routing, RFC-compliant caching, and health telemetry.
2. **Security / Session Layer (L5/L6):** TLS 1.3 cryptographic termination via a custom two-tier Public Key Infrastructure (PKI).
3. **Transport Layer (L4):** Connection-oriented TCP socket management and load distribution across dual upstream nodes.
4. **Internetwork / Name Resolution Layer (L3):** Authoritative local DNS mapping for non-routable `.test` top-level domains.

The design emphasizes high availability, zero-downtime failover, client isolation resilience, and end-to-end packet auditability without reliance on external internet connectivity.

---

## 3. Physical & Logical Network Architecture

The project maps four logical network tiers across three physical macOS machines:

```
                                [ Client Machine ]
                     (Browser / curl / Test Automation Suite)
                                        │
             ┌──────────────────────────┴──────────────────────────┐
             │                                                     │
             ▼                                                     ▼
  [ Node 1: Private DNS ]                               [ Node 2: Edge Proxy ]
    Machine 1 (Port 53)                                  Machine 1 (Port 443)
  dnsmasq (app.team1.test)                              NGINX TLS Termination
             │                                                     │
             └──────────────────────────┬──────────────────────────┘
                                        │
                       (Layer 7 Round-Robin Load Balancer)
                                        │
                        ┌───────────────┴───────────────┐
                        ▼                               ▼
             [ Node 3: Backend A ]            [ Node 4: Backend B ]
              Machine 2 (Port 3001)            Machine 3 (Port 3002)
              X-Backend: Server-A              X-Backend: Server-B
```

### Host & Port Allocation Table

| Node Identifier | Physical Machine | IPv4 Address | Protocol / Port | Service / Daemon | Purpose |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Node 1** | Machine 1 (Adnan) | `192.168.1.50` | UDP / TCP `53` | `dnsmasq` | Resolves `app.team1.test` to Edge IP |
| **Node 2** | Machine 1 (Adnan) | `192.168.1.50` | TCP `443` (SSL) / `80` | `nginx/1.25.4` | SSL Termination & Load Balancer |
| **Node 3** | Machine 2 (Praanshu) | `192.168.1.51` | TCP `3001` (HTTP) | Node.js Express | Upstream REST Microservice A |
| **Node 4** | Machine 3 (Aditya) | `192.168.1.52` | TCP `3002` (HTTP) | Node.js Express | Upstream REST Microservice B & Client Node |

---

## 4. Technical Module Implementation Details

### Module A: Private LAN Subnet Architecture
- Established an isolated private Class C network (`192.168.1.0/24`).
- Validated full bidirectional Layer 3 reachability via ICMP echo exchanges across all physical host pairs with 0% packet loss and sub-2ms round-trip latency.

### Module B: Authoritative Private DNS Resolution
- Deployed `dnsmasq` listening on `0.0.0.0:53`.
- Configured zone records in `dns/dnsmasq.conf`:
  ```conf
  domain=team1.test
  local=/team1.test/
  address=/app.team1.test/192.168.1.50
  address=/api.team1.test/192.168.1.50
  ```
- Verified query answers return `status: NOERROR` with authoritative flag `aa` and instantaneous resolution.

### Module C: Dual REST Microservices
- Implemented independent Node.js Express applications for Backend A (`backend-a/server.js`) and Backend B (`backend-b/server.js`).
- Integrated dynamic response headers:
  - `X-Backend: Server-A` on Port 3001
  - `X-Backend: Server-B` on Port 3002
- Implemented `/api/status` for health telemetry and `/api/data` for cached payload distribution.

### Module D: Edge Reverse Proxy & Round-Robin Load Balancing
- Configured NGINX upstream cluster with active-passive health monitoring:
  ```nginx
  upstream backend_cluster {
      server 192.168.1.51:3001 max_fails=2 fail_timeout=5s;
      server 192.168.1.52:3002 max_fails=2 fail_timeout=5s;
  }
  ```
- Traffic alternates uniformly between Node 3 and Node 4 on sequential HTTP transactions.
- Automated failover: If an upstream instance fails health thresholds (`max_fails=2`), NGINX drops it from the active rotation within 5 seconds without returning `502 Bad Gateway` to the client.

### Module E: Public Key Infrastructure & TLS 1.3 Termination
- Built a two-tier PKI trust hierarchy:
  1. **Root CA:** Generated 2048-bit RSA private key (`rootCA.key`) and self-signed X.509 certificate (`rootCA.crt`).
  2. **Server Certificate:** Generated CSR with Subject Alternative Names (`DNS:app.team1.test`, `DNS:api.team1.test`, `IP:127.0.0.1`) signed by Root CA (`app.team1.test.crt`).
- Configured NGINX with `ssl_protocols TLSv1.2 TLSv1.3` and high-strength cipher suites.
- Cryptographic verification via OpenSSL:
  ```bash
  openssl verify -CAfile certs/rootCA.crt certs/app.team1.test.crt
  # Result: certs/app.team1.test.crt: OK
  ```
- Client requests validate cleanly over standard HTTPS **without using the `-k` (insecure) flag**.

### Module F: HTTP Caching & Conditional Revalidation
- Implemented HTTP/1.1 cache directives on `/api/data`:
  - `Cache-Control: max-age=60, public`
  - `ETag: W/"cloudpulse-v1-static-hash"`
- When clients send conditional requests with `If-None-Match`, the backend validates resource freshness and responds with **`HTTP/1.1 304 Not Modified`** with zero response body, eliminating redundant network payload transmission.

### Module G: Wireshark Protocol Forensics
Captured and documented full packet traces in `docs/WIRESHARK_EVIDENCE.md`:
- **UDP Port 53:** `Standard query A app.team1.test` and answer return.
- **TCP Port 443:** 3-Way Handshake (`[SYN]`, `[SYN, ACK]`, `[ACK]`).
- **TLS 1.3:** `ClientHello`, `ServerHello`, key exchange, and transition to encrypted `Application Data` records.
- **HTTP Layer Isolation:** Confirmed application headers and payloads are fully masked inside ciphertext records over transit.

---

## 5. Verification & Automated Test Results

The platform includes an automated regression test runner (`test_phase1.sh`). All contracts pass deterministically:

```text
==========================================================
Running Automated Network & API Tests
==========================================================
Checking Backend A (Port 3001)... PASS (Identified: Server-A)
Checking Backend B (Port 3002)... PASS (Identified: Server-B)
Checking X-Backend Response Header... PASS (X-Backend: Server-A)
Checking HTTP Cache-Control & ETag Headers... PASS (Cache-Control: max-age=60, public | ETag: W/"cloudpulse-v1-static-hash")

Simulating Nginx Load Balancing Flow:
  Request #1 -> Directed to Port 3002 -> Received Response from: Server-B
  Request #2 -> Directed to Port 3001 -> Received Response from: Server-A
  Request #3 -> Directed to Port 3002 -> Received Response from: Server-B
  Request #4 -> Directed to Port 3001 -> Received Response from: Server-A
  Request #5 -> Directed to Port 3002 -> Received Response from: Server-B
  Request #6 -> Directed to Port 3001 -> Received Response from: Server-A

==========================================================
All Core Application & API Contracts Verified!
==========================================================
```

---

## 6. Failure Injection & Resilience Analysis

- **Fault Injected:** Unscheduled termination of Backend Node A process on Port 3001 (`kill -9`).
- **Observed Behavior:** Subsequent client requests to `https://app.team1.test/api/status` experienced zero dropped packets. NGINX passively isolated Node A and routed 100% of incoming requests to Backend Node B (`X-Backend: Server-B`).
- **Recovery:** Invocation of `./start_all.sh` re-initialized the Port 3001 listener. NGINX restored Node A to active service within the designated `fail_timeout` window, seamlessly re-establishing uniform Round-Robin rotation.

---

## 7. Conclusion

CloudPulse successfully validates all theoretical and practical objectives mandated by the Computer Networks curriculum:
- Deterministic Layer 3 resolution without public DNS dependency.
- Modern Layer 7 reverse proxying and cryptographic transport layer security.
- Transparent upstream microservice balancing and fault recovery.
- Strict RFC compliance in HTTP caching and header management.

The system is fully documented, verified via automated test runners, and ready for comprehensive evaluation.
