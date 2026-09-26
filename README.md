# CloudPulse — Private Network Service Platform
> **Computer Networks Course Project — Phase 1 Build & Observe**

CloudPulse is a two-phase, distributed local networking platform simulating a private enterprise cloud architecture across a local area network (LAN).

---

## 📐 Architecture & Machine Roles

```
                            [ Client Machine ]
                           (Browser / curl test)
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

## 🛠️ Tech Stack & Components

- **Edge Proxy & Load Balancer**: Nginx (TLS 1.2/1.3 Termination & Upstream Round-Robin)
- **Private DNS Server**: `dnsmasq` (.test TLD resolution)
- **Backend Microservices**: Node.js & Express REST APIs
- **TLS Certificates**: OpenSSL SAN Certificates signed by custom Root CA
- **Testing & Verification**: Bash automated test suite & Wireshark protocol capture

---

## 🚀 Quick Start Guide

1. **Install dependencies**:
   ```bash
   cd backend-a && npm install
   cd ../backend-b && npm install
   ```

2. **Launch Local Backends**:
   ```bash
   ./start_all.sh
   ```

3. **Run Automated Test Suite**:
   ```bash
   ./test_phase1.sh
   ```

---

## 📑 Course Rubric Documentation

- [Architecture Specifications](docs/ARCHITECTURE_PHASE1.md)
- [Viva & Demonstration Walkthrough](docs/VIVA_GUIDE_PHASE1.md)
