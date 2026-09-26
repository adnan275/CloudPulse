# Phase 1 Evaluation & Viva Presentation Cheat Sheet
## 11-Step Live Demonstration Walkthrough (Review 1: 50 Marks)

Follow this exact sequence during your live evaluation with the faculty.

---

### Step 1: Topology & IP Inventory (10 Marks)
- **Show**: Display `docs/ARCHITECTURE_PHASE1.md` diagram and show machine IPs.
- **Explain**: "We have divided our network topology into 4 distinct roles: Mac 1 runs private DNS via `dnsmasq`, Mac 2 acts as our Edge Nginx reverse proxy with TLS termination, and Mac 3 & 4 run Node.js REST API microservices."

### Step 2: Private LAN Reachability
- **Run**: `ping -c 3 <Mac2_IP>` from Mac 1 or Mac 4.
- **Explain**: "All machines connect to the same Wi-Fi subnet and have ICMP reachability."

### Step 3: Private DNS Resolution (Task B)
- **Run**: `dig @<Mac1_IP> app.team1.test`
- **Show**: Answer section returning Mac 2 IP (`192.168.x.x`).
- **Explain**: "`dnsmasq` listens on port 53 and maps the `.test` namespace locally."

### Step 4: HTTPS Access via Domain Name (Task E)
- **Run**: Open `https://app.team1.test` in Safari/Chrome or `curl -v https://app.team1.test/api/status`
- **Show**: Green padlock / SSL handshake succeeded, returning JSON status.
- **Explain**: "TLS is terminated at Nginx using our local Root CA certificate."

### Step 5: Load Balancing Distribution (Task D)
- **Run**: Click **"Run 6x Requests"** on the dashboard or run:
  ```bash
  for i in {1..4}; do curl -sI https://app.team1.test/api/status | grep -i "X-Backend"; done
  ```
- **Show**: Alternating output: `X-Backend: Server-A` ➔ `X-Backend: Server-B`.
- **Explain**: "Nginx uses a round-robin algorithm to balance traffic across upstream ports 3001 and 3002."

### Step 6: Wireshark Packet Evidence (Task G)
- **Wireshark Filters to Show**:
  - DNS: `dns.qry.name == "app.team1.test"`
  - TCP Handshake: `tcp.port == 443 && tcp.flags.syn == 1`
  - TLS Handshake: `tls.handshake.type == 1` (ClientHello)
- **Explain**: Point out source/destination ephemeral ports and encrypted application payload.

### Step 7: HTTP Caching Behavior (Task F)
- **Run**: `curl -i https://app.team1.test/api/data`
- **Show**: `Cache-Control: max-age=60` and `ETag` headers. Click "Fetch Cached Resource" on dashboard.
- **Explain**: "Client reuses cached data for 60 seconds; conditional requests return `304 Not Modified`."

### Step 8: Single Backend Failure & Recovery
- **Action**: Stop `server.js` on Mac 3 (Backend A).
- **Run**: `curl https://app.team1.test/api/status`
- **Show**: Request still succeeds 100% of the time through Backend B.
- **Explain**: "Nginx automatically detects backend failure via upstream health checks and routes around the dead node."

---

### Key Viva Questions & Answers (10 Marks Individual Viva)

1. **Q: What is the difference between DNS resolution and TCP connection?**
   - **A**: DNS resolution only resolves the domain name string (`app.team1.test`) to an IPv4 address via UDP port 53. Once the client knows the IP address, it creates an independent TCP connection (port 443) to transfer HTTP data.

2. **Q: Why does the client never need to know the backend server IPs?**
   - **A**: Because the edge reverse proxy (Mac 2 Nginx) abstracts the internal topology. The client only communicates with the reverse proxy IP over TLS.

3. **Q: What happens when Nginx receives an HTTPS request?**
   - **A**: Nginx completes the TLS handshake, decrypts the request payload, selects a healthy backend from the `upstream` pool, forwards the request over unencrypted HTTP internally, receives the backend response, re-encrypts it, and returns it to the client.
