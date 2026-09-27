#!/bin/bash

GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}==========================================================${NC}"
echo -e "${BLUE}🔍 CloudPulse Network Environment Diagnostics${NC}"
echo -e "${BLUE}==========================================================${NC}"

echo -n "1. Active Network Interface (en0): "
IFACE_IP=$(ipconfig getifaddr en0 2>/dev/null || echo "Disconnected")
echo -e "${GREEN}$IFACE_IP${NC}"

echo -n "2. Checking DNS Resolution (app.team1.test): "
if host app.team1.test >/dev/null 2>&1 || grep -q "app.team1.test" /etc/hosts; then
  echo -e "${GREEN}Configured${NC}"
else
  echo -e "${RED}Not Configured (Add to /etc/hosts or dnsmasq)${NC}"
fi

echo -n "3. Checking Backend A Port (3001): "
if nc -z 127.0.0.1 3001 2>/dev/null; then
  echo -e "${GREEN}Listening${NC}"
else
  echo -e "${RED}Offline${NC}"
fi

echo -n "4. Checking Backend B Port (3002): "
if nc -z 127.0.0.1 3002 2>/dev/null; then
  echo -e "${GREEN}Listening${NC}"
else
  echo -e "${RED}Offline${NC}"
fi

echo -e "${BLUE}==========================================================${NC}"
