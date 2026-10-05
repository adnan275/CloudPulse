# 🌐 CloudPulse — Private Network Service Platform
> **Computer Networks Course Project — Phase 1 & 2 Build & Observe**

![Network Infrastructure](https://img.shields.io/badge/Network-Private_LAN-06b6d4?style=for-the-badge&logo=virtualbox)
![Protocols](https://img.shields.io/badge/Protocols-DNS%20%7C%20TCP%20%7C%20TLS%20%7C%20HTTP%2F1.1-3b82f6?style=for-the-badge&logo=nginx)
![Security](https://img.shields.io/badge/Security-TLS_1.3_Termination-10b981?style=for-the-badge&logo=letsencrypt)
![Load Balancer](https://img.shields.io/badge/Load_Balancer-Nginx_Round--Robin-8b5cf6?style=for-the-badge&logo=nginx)

CloudPulse is a high-availability, distributed local network service platform simulating enterprise cloud infrastructure across a private local area network (LAN). It demonstrates full packet traversal, private DNS resolution, edge reverse proxying, TLS termination, round-robin load balancing, and HTTP caching.

---

## 🎨 Network Architecture Topology (3-Machine Deployment)

```mermaid
flowchart TD
    classDef client fill:#1e293b,stroke:#06b6d4,stroke-width:2px,color:#fff,font-size:15px
    classDef gateway fill:#1e1b4b,stroke:#8b5cf6,stroke-width:2px,color:#fff,font-size:15px
    classDef backend1 fill:#064e3b,stroke:#10b981,stroke-width:2px,color:#fff,font-size:15px
    classDef backend2 fill:#1e3a8a,stroke:#3b82f6,stroke-width:2px,color:#fff,font-size:15px

    subgraph Host3 ["🖥️ Machine 3: Compute Node B & Client (Aditya Pal)"]
        Client["💻 Client Machine<br/>(Browser / curl / Test Suite)"]:::client
        BackendB["⚡ Backend Server B<br/>Port 3002 | X-Backend: Server-B"]:::backend2
    end

    subgraph Host1 ["🛡️ Machine 1: Edge Gateway & DNS (Adnan Rizvi - Lead)"]
        DNS["🌐 Private DNS Server<br/>(dnsmasq :: Port 53 UDP)"]:::gateway
        Nginx["🛡️ Nginx Reverse Proxy<br/>TLS 1.3 Termination (Port 443 HTTPS)"]:::gateway
    end

    subgraph Host2 ["⚡ Machine 2: Compute Node A (Praanshu Ranjan)"]
        BackendA["⚡ Backend Server A<br/>Port 3001 | X-Backend: Server-A"]:::backend1
    end

    Client -- "1. DNS Query (app.team1.test)" --> DNS
    DNS -- "2. Returns Machine 1 IP" --> Client
    Client -- "3. HTTPS Request (TLS 1.3 / Port 443)" --> Nginx
    Nginx -- "4. Round-Robin Pass (Port 3001)" --> BackendA
    Nginx -- "4. Alternate Pass (Port 3002)" --> BackendB
```

---

## ⚡ End-to-End Protocol Flow Sequence 

```mermaid
sequenceDiagram
    autonumber
    actor Client as 💻 Client (Machine 3 - Aditya)
    participant Gateway as 🛡️ Machine 1: Edge & DNS (Adnan)
    participant NodeA as ⚡ Machine 2: Backend A (Praanshu)
    participant NodeB as ⚡ Machine 3: Backend B (Aditya)

    Note over Client, Gateway: Step 1: DNS Resolution (UDP 53)
    Client->>Gateway: A-Record Lookup (app.team1.test)
    Gateway-->>Client: Response: Machine 1 IPv4 (192.168.x.x)

    Note over Client, Gateway: Step 2: Transport & Security (TCP/TLS)
    Client->>Gateway: TCP 3-Way Handshake (SYN ➔ SYN-ACK ➔ ACK)
    Client->>Gateway: TLS ClientHello
    Gateway-->>Client: TLS ServerHello + SSL Certificate (Root CA Signed)
    Note over Client, Gateway: TLS 1.3 Encrypted Channel Established

    Note over Client, NodeA: Step 3: HTTP Request & Load Balancing
    Client->>Gateway: GET /api/status (Encrypted HTTPS)
    Gateway->>NodeA: Proxy Pass (http://Machine2_IP:3001)
    NodeA-->>Gateway: 200 OK (X-Backend: Server-A)
    Gateway-->>Client: Return Response (Encrypted)

    Note over Client, NodeB: Step 4: Subsequent Request (Round-Robin)
    Client->>Gateway: GET /api/status (Second Request)
    Gateway->>NodeB: Proxy Pass (http://Machine3_IP:3002)
    NodeB-->>Gateway: 200 OK (X-Backend: Server-B)
    Gateway-->>Client: Return Response (Encrypted)
```

---

## 🖥️ Logical Node Roles & 3-Machine Deployment

| Logical Node | Host / Member | Services Running | Interface & Listening Ports | Cloud Equivalent |
| :--- | :--- | :--- | :--- | :--- |
| **Node 1 (Private DNS)** | **Machine 1** (Adnan Rizvi) | `dnsmasq`, `dig`, `nslookup` | `0.0.0.0:53 (UDP/TCP)` | AWS Route 53 / Cloudflare DNS |
| **Node 2 (Edge Proxy)** | **Machine 1** (Adnan Rizvi) | `Nginx`, TLS 1.3 Termination | `0.0.0.0:443 (HTTPS)`, `80` | AWS Application Load Balancer (ALB) |
| **Node 3 (Backend A)** | **Machine 2** (Praanshu) | Node.js Express REST API (Server-A) | `0.0.0.0:3001 (HTTP)` | Compute Instance / EC2 A |
| **Node 4 (Backend B)** | **Machine 3** (Aditya Pal) | Node.js Express REST API (Server-B) | `0.0.0.0:3002 (HTTP)` | Compute Instance / EC2 B |

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
| **Task G** | Wireshark Protocol Flow | [`docs/ARCHITECTURE_PHASE1.md`](docs/ARCHITECTURE_PHASE1.md) |

---

## 🔍 Wireshark Packet Evidence Filters

| Protocol Layer | Wireshark Display Filter | Evidence to Highlight |
| :--- | :--- | :--- |
| **DNS** | `dns.flags.response == 1` | Resolves `app.team1.test` to Machine 1 (Edge) IPv4 |
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
- 📡 [Task G: Wireshark Packet Evidence & Protocol Analysis](docs/WIRESHARK_EVIDENCE.md)

---

## 👥 Team Contributors

| Contributor | GitHub Profile | Project Responsibilities |
| :--- | :--- | :--- |
| **Adnan Rizvi** (`2401010043`) | [@adnan275](https://github.com/adnan275) | **Team Lead** — System Architecture, NGINX Load Balancing & Edge Security |
| **Praanshu Ranjan** (`2401010329`) | [@praanshuranjan](https://github.com/praanshuranjan) | Backend Microservices (Node.js REST API & Routing) |
| **Aditya Pal** (`2401020082`)  |  [@garariya](https://github.com/garariya) | DNS Infrastructure, Testing & Performance Automation |

