#!/bin/bash
PROJECT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$PROJECT_DIR"

echo "Starting Backend A on port 3001..."
node backend-a/server.js &
PID_A=$!

echo "Starting Backend B on port 3002..."
node backend-b/server.js &
PID_B=$!

echo "Backend A running (PID: $PID_A) -> http://0.0.0.0:3001"
echo "Backend B running (PID: $PID_B) -> http://0.0.0.0:3002"

trap "kill $PID_A $PID_B 2>/dev/null" EXIT INT TERM
wait
