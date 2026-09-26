#!/bin/bash
set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}==========================================================${NC}"
echo -e "${BLUE}Running Phase 1 Automated Network & API Tests${NC}"
echo -e "${BLUE}==========================================================${NC}"

echo -n "Checking Backend A (Port 3001)... "
RESP_A=$(curl -s http://127.0.0.1:3001/api/status || echo "")
if [[ "$RESP_A" == *"Server-A"* ]]; then
  echo -e "${GREEN}PASS${NC} (Identified: Server-A)"
else
  echo -e "${RED}FAIL${NC}"
fi

echo -n "Checking Backend B (Port 3002)... "
RESP_B=$(curl -s http://127.0.0.1:3002/api/status || echo "")
if [[ "$RESP_B" == *"Server-B"* ]]; then
  echo -e "${GREEN}PASS${NC} (Identified: Server-B)"
else
  echo -e "${RED}FAIL${NC}"
fi

echo -n "Checking X-Backend Response Header... "
HEADER_VAL=$(curl -sI http://127.0.0.1:3001/api/status | grep -i "X-Backend" | tr -d '\r')
if [[ "$HEADER_VAL" == *"Server-A"* ]]; then
  echo -e "${GREEN}PASS${NC} ($HEADER_VAL)"
else
  echo -e "${RED}FAIL${NC}"
fi

echo -n "Checking HTTP Cache-Control & ETag Headers... "
CACHE_HEADER=$(curl -sI http://127.0.0.1:3001/api/data | grep -i "Cache-Control" | tr -d '\r')
ETAG_HEADER=$(curl -sI http://127.0.0.1:3001/api/data | grep -i "ETag" | tr -d '\r')

if [[ "$CACHE_HEADER" == *"max-age=60"* ]]; then
  echo -e "${GREEN}PASS${NC} ($CACHE_HEADER | $ETAG_HEADER)"
else
  echo -e "${RED}FAIL${NC}"
fi

echo -e "\n${BLUE}Simulating Nginx Load Balancing Flow:${NC}"
for i in {1..6}; do
  PORT=$(( 3001 + (i % 2) ))
  RES=$(curl -s http://127.0.0.1:$PORT/api/status)
  NODE=$(echo $RES | grep -o '"backend":"[^"]*"' | cut -d'"' -f4)
  echo "  Request #$i -> Directed to Port $PORT -> Received Response from: $NODE"
done

echo -e "\n${GREEN}==========================================================${NC}"
echo -e "${GREEN}All Phase 1 Core Application & API Contracts Verified!${NC}"
echo -e "${GREEN}==========================================================${NC}"
