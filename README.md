# 🌐 CloudPulse — Private Network Service Platform
> **Computer Networks Course Project — Phase 1 & 2 Build & Observe**

![Network Infrastructure](https://img.shields.io/badge/Network-Private_LAN-06b6d4?style=for-the-badge&logo=virtualbox)
![Protocols](https://img.shields.io/badge/Protocols-DNS%20%7C%20TCP%20%7C%20TLS%20%7C%20HTTP%2F1.1-3b82f6?style=for-the-badge&logo=nginx)
![Security](https://img.shields.io/badge/Security-TLS_1.3_Termination-10b981?style=for-the-badge&logo=letsencrypt)
![Load Balancer](https://img.shields.io/badge/Load_Balancer-Nginx_Round--Robin-8b5cf6?style=for-the-badge&logo=nginx)

CloudPulse is a high-availability, distributed local network service platform simulating enterprise cloud infrastructure across a private local area network (LAN). It demonstrates full packet traversal, private DNS resolution, edge reverse proxying, TLS termination, round-robin load balancing, and HTTP caching.

---

## 🎨 Network Architecture Topology (Mermaid Diagram)

```mermaid
flowchart TD
    classDef client fill:#1e293b,stroke:#06b6d4,stroke-width:2px,color:#fff
    classDef dns fill:#312e81,stroke:#8b5cf6,stroke-width:2px,color:#fff
    classDef edge fill:#1e3a8a,stroke:#3b82f6,stroke-width:2px,color:#fff
    classDef backend fill:#064e3b,stroke:#10b981,stroke-width:2px,color:#fff

    Client["💻 Client Machine<br/>(Browser / curl)"]:::client
    
    subgraph DNS_Layer ["DNS Resolution Layer (Port 53)"]
        DNS["🌐 Mac 1: Private DNS Server<br/>(dnsmasq :: app.team1.test)"]:::dns
    end

    subgraph Edge_Layer ["Edge Proxy & Security Layer (Port 443)"]
        Nginx["🛡️ Mac 2: Nginx Reverse Proxy<br/>& TLS Termination Engine"]:::edge
    end

    subgraph Cluster_Layer ["Upstream Load Balanced Microservices"]
        BackendA["⚡ Mac 3: Backend Node A<br/>Port 3001 | X-Backend: Server-A"]:::backend
        BackendB["⚡ Mac 4: Backend Node B<br/>Port 3002 | X-Backend: Server-B"]:::backend
    end

    Client -- "1. DNS Query (app.team1.test)" --> DNS
    DNS -- "2. Returns Mac 2 IPv4" --> Client
    Client -- "3. HTTPS Request (TLS 1.3 / Port 443)" --> Nginx
    Nginx -- "4. Round-Robin Pass (Port 3001)" --> BackendA
    Nginx -- "4. Alternate Pass (Port 3002)" --> BackendB
```

---

## ⚡ End-to-End Protocol Flow Sequence (Mermaid Diagram)

```mermaid
sequenceDiagram
    autonumber
    actor Client as Client Machine
    participant DNS as Mac 1 (dnsmasq)
    participant Edge as Mac 2 (Nginx Edge)
    participant NodeA as Mac 3 (Backend A)
    participant NodeB as Mac 4 (Backend B)

    Note over Client, DNS: Step 1: DNS Resolution (UDP 53)
    Client->>DNS: A-Record Lookup (app.team1.test)
    DNS-->>Client: Response: 192.168.x.x (Mac 2 IP)

    Note over Client, Edge: Step 2: Transport & Security (TCP/TLS)
    Client->>Edge: TCP 3-Way Handshake (SYN ➔ SYN-ACK ➔ ACK)
    Client->>Edge: TLS ClientHello
    Edge-->>Client: TLS ServerHello + SSL Certificate (Root CA Signed)
    Note over Client, Edge: TLS Session Key Encrypted Channel Established

    Note over Client, NodeA: Step 3: HTTP Request & Load Balancing
    Client->>Edge: GET /api/status (Encrypted HTTPS)
    Edge->>NodeA: Proxy Pass (http://127.0.0.1:3001)
    NodeA-->>Edge: 200 OK (X-Backend: Server-A)
    Edge-->>Client: Return Response (Encrypted)

    Note over Client, NodeB: Step 4: Subsequent Request (Round-Robin)
    Client->>Edge: GET /api/status (Second Request)
    Edge->>NodeB: Proxy Pass (http://127.0.0.1:3002)
    NodeB-->>Edge: 200 OK (X-Backend: Server-B)
    Edge-->>Client: Return Response (Encrypted)
```

---

## 🖥️ Machine Roles & Topology Inventory

| Machine Role | Services Running | Interface & Listening Ports | Cloud Equivalent |
| :--- | :--- | :--- | :--- |
| **Mac 1** (Private DNS) | `dnsmasq`, `dig`, `nslookup` | `0.0.0.0:53 (UDP/TCP)` | AWS Route 53 / Cloudflare DNS |
| **Mac 2** (Edge Proxy) | `Nginx`, TLS SSL Engine | `0.0.0.0:443 (HTTPS)`, `80` | AWS Application Load Balancer (ALB) |
| **Mac 3** (Backend A) | Node.js Express REST API | `0.0.0.0:3001 (HTTP)` | Compute Instance / EC2 A |
| **Mac 4** (Backend B) | Node.js Express REST API | `0.0.0.0:3002 (HTTP)` | Compute Instance / EC2 B |

---

## 📊 Course Rubric Task Mapping (Phase 1)

| Task | Objective | Deliverable / Artifact |
| :--- | :--- | :--- |
| **Task A** | Establish Private LAN | [`docs/ARCHITECTURE_PHASE1.md`](docs/ARCHITECTURE_PHASE1.md) |
| **Task B** | Configure Private DNS | [`dns/dnsmasq.conf`](dns/dnsmasq.conf) |
| **Task C** | Build 2 REST Backends | [`backend-a/server.js`](backend-a/server.js), [`backend-b/server.js`](backend-b/server.js) |
| **Task D** | Edge Proxy & Load Balancer | [`nginx/nginx.conf`](nginx/nginx.conf) |
| **Task E** | HTTPS / TLS Termination | [`certs/generate_certs.sh`](certs/generate_certs.sh) |
| **Task F** | HTTP Caching & 304 | [`public/app.js`](public/app.js) (`/api/data`) |
| **Task G** | Wireshark Protocol Flow | [`docs/VIVA_GUIDE_PHASE1.md`](docs/VIVA_GUIDE_PHASE1.md) |

---

## 🔍 Wireshark Packet Evidence Filters

| Protocol Layer | Wireshark Display Filter | Evidence to Highlight |
| :--- | :--- | :--- |
| **DNS** | `dns.flags.response == 1` | Resolves `app.team1.test` to Mac 2 IPv4 |
| **TCP Handshake** | `tcp.port == 443 && tcp.flags.syn == 1` | 3-way handshake (`SYN` ➔ `SYN-ACK` ➔ `ACK`) |
| **TLS Handshake** | `tls.handshake.type == 1` | `ClientHello`, `ServerHello`, Certificate validation |
| **HTTP Payload** | `http || tls` | Request headers & `X-Backend` header distribution |

---

## 🚀 Quick Execution Guide

```bash
# 1. Install Dependencies
cd backend-a && npm install && cd ../backend-b && npm install && cd ..

# 2. Start Local Microservices
./start_all.sh

# 3. Execute Automated Phase 1 Test Runner
./test_phase1.sh
```

---

## 📄 Documentation & Reports

- 📘 [Phase 1 Architecture Specifications](docs/ARCHITECTURE_PHASE1.md)
- 📗 [Viva Presentation Cheat Sheet & Q&A](docs/VIVA_GUIDE_PHASE1.md)
