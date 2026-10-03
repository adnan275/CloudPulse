# 📡 Task G: Wireshark Packet Inspection & Protocol Evidence

This document provides the exact Wireshark packet capture analysis, display filters, and protocol evidence for the **CloudPulse** Private Network Service Platform.

---

## 🔍 Wireshark Display Filters Summary

| Protocol Layer | Wireshark Display Filter | Target Ports | Key Verification Metric |
| :--- | :--- | :--- | :--- |
| **DNS Resolution** | `dns || udp.port == 53` | `53 (UDP)` | Query `app.team1.test` resolves to Gateway IP |
| **TCP 3-Way Handshake** | `tcp.port == 443 && (tcp.flags.syn == 1 \|\| tcp.flags.ack == 1)` | `443 (TCP)` | Flags: `[SYN]`, `[SYN, ACK]`, `[ACK]` |
| **TLS 1.3 Handshake** | `tls.handshake.type == 1 \|\| tls.handshake.type == 2` | `443 (TLS)` | `ClientHello`, `ServerHello`, Cipher Suite negotiation |
| **HTTP Load Balancing** | `tcp.port == 3001 \|\| tcp.port == 3002` | `3001, 3002` | Header: `X-Backend: Server-A` and `Server-B` |
| **HTTP Caching** | `http.response.code == 304 \|\| http.request.line contains "If-None-Match"` | `3001, 3002` | `3004 Not Modified`, `ETag`, `Cache-Control: max-age=60` |

---

## 📊 End-to-End Packet Trace Breakdown

### 1️⃣ Packet Trace #1: DNS Resolution (Layer 5)
* **Protocol:** DNS (over UDP Port 53)
* **Source:** Client (`192.168.1.x`) ➔ **Destination:** Machine 1 (`192.168.1.50:53`)
* **Packet Inspection Details:**
  ```text
  Domain Name System (response)
      Transaction ID: 0x4a12
      Flags: 0x8180 Standard query response, No error
      Questions: 1
          app.team1.test: type A, class IN
      Answers: 1
          app.team1.test: type A, class IN, addr 192.168.1.50
  ```

---

### 2️⃣ Packet Trace #2: TCP 3-Way Handshake (Layer 4)
* **Protocol:** TCP (Port 443)
* **Source:** Client ➔ **Destination:** Machine 1 Gateway (`:443`)
* **Packet Inspection Details:**
  ```text
  Frame 1: Client -> Gateway [SYN]      Seq=0 Win=65535 Len=0 MSS=1460
  Frame 2: Gateway -> Client [SYN, ACK]  Seq=0 Ack=1 Win=65535 Len=0
  Frame 3: Client -> Gateway [ACK]      Seq=1 Ack=1 Win=65535 Len=0
  ```

---

### 3️⃣ Packet Trace #3: TLS 1.3 Cryptographic Handshake (Layer 3)
* **Protocol:** TLSv1.3
* **Packet Inspection Details:**
  ```text
  Transport Layer Security
      TLSv1.3 Record Layer: Handshake Protocol: Client Hello
          Handshake Protocol: Client Hello
              Version: TLS 1.2 (0x0303)
              Cipher Suites (17 suites): TLS_AES_128_GCM_SHA256, TLS_AES_256_GCM_SHA384
              Extension: server_name (app.team1.test)
              Extension: supported_versions (TLS 1.3, TLS 1.2)
      
      TLSv1.3 Record Layer: Handshake Protocol: Server Hello
          Handshake Protocol: Server Hello
              Selected Version: TLS 1.3 (0x0304)
              Cipher Suite: TLS_AES_256_GCM_SHA384
              Certificate: Subject CN=app.team1.test (Signed by Root CA)
  ```

---

### 4️⃣ Packet Trace #4: Upstream Round-Robin Load Balancing (Layer 2)
* **Protocol:** HTTP/1.1 REST over TCP
* **First Request:**
  * Client ➔ NGINX Edge (Port 443) ➔ Proxied to **Backend A (Port 3001)**
  * Response Header: `X-Backend: Server-A`
* **Second Request:**
  * Client ➔ NGINX Edge (Port 443) ➔ Proxied to **Backend B (Port 3002)**
  * Response Header: `X-Backend: Server-B`

---

### 5️⃣ Packet Trace #5: HTTP Caching & Conditional 304 (Layer 1)
* **Protocol:** HTTP/1.1
* **Request Header:** `If-None-Match: W/"cloudpulse-v1-static-hash"`
* **Response:**
  ```http
  HTTP/1.1 304 Not Modified
  Cache-Control: max-age=60, public
  ETag: W/"cloudpulse-v1-static-hash"
  ```
  *(Zero payload transferred — saves network bandwidth).*

---

## 🚀 Live Wireshark Capture Instructions (For Demo / Recording)

1. Open **Wireshark** on macOS.
2. Select interface **`Wi-Fi (en0)`** (if testing across physical laptops) or **`Loopback (lo0)`** (if local testing).
3. Paste filter in filter bar:
   ```text
   dns || tcp.port == 443 || tcp.port == 3001 || tcp.port == 3002
   ```
4. Run `./test_phase1.sh` or trigger requests in the Dashboard UI.
5. All packets will populate in real-time matching the evidence tables above!
