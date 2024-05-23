#!/bin/bash

read -p "Enter the domain name: " DOMAIN
read -p "Enter your email address: " EMAIL

SOURCE_DIR="."
HAPROXY_DIR="./haproxy"

mkdir -p $HAPROXY_DIR

if ! command -v certbot &> /dev/null
then
    echo "Certbot not found, installing..."
    sudo apt-get update
    sudo apt-get install -y certbot
fi

sudo certbot certonly --standalone -d $DOMAIN --non-interactive --agree-tos --email $EMAIL

cat <<EOL > $HAPROXY_DIR/haproxy.cfg
global
    log 127.0.0.1 local0 debug
    log /dev/log local0
    log /dev/log local1 notice
    chroot /var/lib/haproxy
    stats timeout 30s
    user haproxy
    group haproxy
    daemon

defaults
    log global
    mode http
    option httplog
    option dontlognull
    timeout connect 5000
    timeout client 50000
    timeout server 50000

resolvers docker
    nameserver dns1 127.0.0.11:53
    resolve_retries 3
    timeout resolve 1s
    timeout retry   1s
    hold other      10s
    hold refused    10s
    hold nx         10s
    hold timeout    10s
    hold valid      10s
    hold obsolete   10s

frontend http
    bind *:80
    acl is_not_https ssl_fc,not
    redirect scheme https if is_not_https
EOL

cat <<EOL > $HAPROXY_DIR/target_servers.cfg
backend workspaces-micro-proxy
    balance roundrobin
    server workspaces-micro-proxy workspaces-micro-proxy:5002 resolvers docker
EOL

cat <<EOL > $HAPROXY_DIR/sites_available.cfg
frontend https
    bind *:443 ssl crt /etc/letsencrypt/live/$DOMAIN/fullchain.pem crt /etc/letsencrypt/live/$DOMAIN/privkey.pem
    acl workspaces-micro-proxy hdr(host) -i $DOMAIN
    use_backend workspaces-micro-proxy if workspaces-micro-proxy

    acl workspaces-micro-proxy-request hdr(Upgrade) -i WebSocket
    acl workspaces-micro-proxy-domain hdr_dom(Host) -i $DOMAIN
    use_backend workspaces-micro-proxy if workspaces-micro-proxy-request workspaces-micro-proxy-domain
EOL

cat <<EOL > docker-compose.yml
version: '3'

services:
  workspaces-micro-proxy:
    build: $SOURCE_DIR
    container_name: workspaces-micro-proxy
    networks:
      - workspaces-proxy-network
    restart: always

  haproxy:
    image: haproxy:latest
    container_name: haproxy
    volumes:
      - ./haproxy/haproxy.cfg:/etc/haproxy/haproxy.cfg
      - ./haproxy/target_servers.cfg:/etc/haproxy/haproxy.d/target_servers.cfg
      - ./haproxy/sites_available.cfg:/etc/haproxy/haproxy.d/sites_available.cfg
      - /etc/letsencrypt:/etc/letsencrypt:ro
    networks:
      - workspaces-proxy-network
    ports:
      - "80:80"
      - "443:443"
    restart: always
    user: root
    command: haproxy -d -f /etc/haproxy/haproxy.cfg -f /etc/haproxy/haproxy.d

networks:
  workspaces-proxy-network:
    external: true
EOL

echo "Docker Compose and HAProxy configuration files have been created successfully."
echo "You can now run 'docker-compose up -d' to start the services."

read -p "Do you want to start the services now? (y/n): " start_now
if [[ "$start_now" == "y" ]]; then
    docker-compose up -d
fi