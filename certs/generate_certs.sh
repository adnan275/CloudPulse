#!/bin/bash
set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR"

DOMAIN="app.team1.test"
ALT_DOMAIN="api.team1.test"

echo "========================================================"
echo "Generating Self-Signed TLS Certificates for $DOMAIN"
echo "========================================================"

openssl genrsa -out rootCA.key 2048 2>/dev/null
openssl req -x509 -new -nodes -key rootCA.key -sha256 -days 365 -out rootCA.crt \
  -subj "/C=IN/ST=Local/L=Campus/O=CN-Team1/OU=Networks/CN=Team1-Root-CA" 2>/dev/null

openssl genrsa -out app.team1.test.key 2048 2>/dev/null

cat <<EOF > san.cnf
[req]
default_bits = 2048
prompt = no
default_md = sha256
req_extensions = req_ext
distinguished_name = dn

[dn]
C = IN
ST = Local
L = Campus
O = CN-Team1
CN = app.team1.test

[req_ext]
subjectAltName = @alt_names

[alt_names]
DNS.1 = app.team1.test
DNS.2 = api.team1.test
DNS.3 = localhost
IP.1 = 127.0.0.1
EOF

openssl req -new -key app.team1.test.key -out app.team1.test.csr -config san.cnf 2>/dev/null

openssl x509 -req -in app.team1.test.csr -CA rootCA.crt -CAkey rootCA.key -CAcreateserial \
  -out app.team1.test.crt -days 365 -sha256 -extfile san.cnf -extensions req_ext 2>/dev/null

echo "Certificates successfully created in $DIR:"
echo "   - rootCA.crt"
echo "   - app.team1.test.crt"
echo "   - app.team1.test.key"
