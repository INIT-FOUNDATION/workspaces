#!/bin/bash

# Function to check if Certbot is installed and install it if not
install_certbot_if_needed() {
    if ! command -v certbot &> /dev/null; then
        echo "Certbot not found, installing..."
        sudo apt-get update
        sudo apt-get install -y certbot
    else
        echo "Certbot is already installed."
    fi
}

# Function to check if Docker is installed and install it if not
install_docker_if_needed() {
    if ! command -v docker &> /dev/null; then
        echo "Docker not found, installing..."
        sudo apt-get update
        sudo apt-get install -y \
            ca-certificates \
            curl \
            gnupg \
            lsb-release

        sudo mkdir -p /etc/apt/keyrings
        curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

        echo \
        "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
        $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

        sudo apt-get update
        sudo apt-get install -y docker-ce docker-ce-cli containerd.io
        sudo curl -L "https://github.com/docker/compose/releases/download/1.29.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/bin/docker-compose
        sudo chmod +x /usr/bin/docker-compose
    else
        echo "Docker is already installed."
    fi
}

# Function to obtain SSL certificates using Certbot
obtain_ssl_certificates() {
    if [ ! -d "/etc/letsencrypt/live/$DOMAIN" ]; then
        sudo certbot certonly --standalone -d $DOMAIN --non-interactive --agree-tos --email $EMAIL
        chmod 644 /etc/letsencrypt/live/$DOMAIN/fullchain.pem
        chmod 644/etc/letsencrypt/live/$DOMAIN/privkey.pem
        cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem /etc/letsencrypt/live/$DOMAIN/privkey.pem > /etc/letsencrypt/live/$DOMAIN/$DOMAIN.pem
    else
        echo "SSL certificates for $DOMAIN already exist. Skipping Certbot."
    fi
}

# Function to create HAProxy configuration files
create_haproxy_config() {
    mkdir -p $HAPROXY_DIR

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
    timeout client 65s
    timeout server 65s
    timeout tunnel 65s

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
    mode http
    option tcplog
    timeout connect 5s
    timeout client 10800s
    timeout server 10800s
    server workspaces-micro-proxy workspaces-micro-proxy:5002 resolvers docker
EOL

    cat <<EOL > $HAPROXY_DIR/sites_available.cfg
frontend https
    bind *:443 ssl crt /etc/letsencrypt/live/$DOMAIN/$DOMAIN.pem
    acl workspaces-micro-proxy hdr(host) -i $DOMAIN
    use_backend workspaces-micro-proxy if workspaces-micro-proxy

    acl workspaces-micro-proxy-request hdr(Upgrade) -i WebSocket
    acl workspaces-micro-proxy-domain hdr_dom(Host) -i $DOMAIN
    use_backend workspaces-micro-proxy if workspaces-micro-proxy-request workspaces-micro-proxy-domain
EOL
}

# Function to create Docker Compose file
create_docker_compose_file() {
    cat <<EOL > docker-compose.yml
version: '3'

services:
  workspaces-micro-proxy:
    build: $SOURCE_DIR
    container_name: workspaces-micro-proxy
    networks:
      - workspaces-proxy-network
    restart: always
    environment:
      - WORKSPACES_REDIS_KEYS_PREFIX=WORKSPACES|
      - WORKSPACES_REDIS_HOST=10.200.0.6
      - WORKSPACES_REDIS_PORT=6379
      - WORKSPACES_MONGODB_HOST=10.200.0.3
      - WORKSPACES_MONGODB_PORT=27017
      - WORKSPACES_MONGODB_DATABASE=workspaces
      - WORKSPACES_MONGODB_AUTH_SOURCE=admin
      - WORKSPACES_MONGODB_USERNAME=mongo
      - WORKSPACES_MONGODB_PASSWORD=419CVN8z592e
      - WORKSPACES_NODE_CACHE_KEYS_PREFIX=WORKSPACES|
      - WORKSPACES_CLIENT_BASE_URL=https://workspaces.orrizonte.in
      - WORKSPACES_SESSIONS_SSL_ENABLED=true
      - WORKSPACES_AGENT_SSL_CERT_PATH=/etc/letsencrypt/live/$DOMAIN/fullchain.pem
      - WORKSPACES_AGENT_SSL_KEY_PATH=/etc/letsencrypt/live/$DOMAIN/privkey.pem
      - NODE_ENV=Production
      - WORKSPACES_ENABLE_TURN_SUPPORT=true
      - WORKSPACES_TURN_SERVERS=[{"urls":["stun:turn.orrizonte.in"]},{"urls":["turn:turn.orrizonte.in"],"username":"a8z7G3p9F1s6","credential":"bmS8QSeG7SHwPLSo"}]
      - HTTPS_ENABLED=true
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - /etc/letsencrypt/live/$DOMAIN/privkey.pem:/usr/src/app/certs/key.pem
      - /etc/letsencrypt/live/$DOMAIN/cert.pem:/usr/src/app/certs/cert.pem

networks:
  workspaces-proxy-network:
    external: true
EOL
}

# Function to check if jq is installed and install it if not
install_jq_if_needed() {
    if ! command -v jq &> /dev/null; then
        echo "jq could not be found. Installing jq..."
        if [ "$(uname)" == "Darwin" ]; then
            # Install jq on macOS using Homebrew
            if ! command -v brew &> /dev/null; then
                echo "Homebrew is not installed. Please install Homebrew first."
                exit 1
            fi
            brew install jq
        elif [ -f /etc/debian_version ]; then
            # Install jq on Debian-based systems
            sudo apt-get update && sudo apt-get install -y jq
        elif [ -f /etc/redhat-release ]; then
            # Install jq on Red Hat-based systems
            sudo yum install -y epel-release
            sudo yum install -y jq
        elif [ -f /etc/arch-release ]; then
            # Install jq on Arch Linux
            sudo pacman -S jq
        else
            echo "Unsupported OS. Please install jq manually."
            exit 1
        fi
        echo "jq installed successfully."
    else
        echo "jq is already installed."
    fi
}

# Function to generate token
generate_token() {
    TOKEN_RESPONSE=$(curl -s -X POST $AUTH_URL -H "Content-Type: application/json" -d '{
        "clientId": "'$CLIENT_ID'",
        "clientSecret": "'$CLIENT_SECRET'"
    }')

    TOKEN=$(echo $TOKEN_RESPONSE | jq -r '.data.token.token')

    if [ "$TOKEN" == "null" ]; then
        echo "Failed to generate token. Response: $TOKEN_RESPONSE"
        exit 1
    fi

    echo "Token generated successfully."
}

# Function to create agent
create_agent() {
    AGENT_RESPONSE=$(curl -s -X POST $AGENT_CREATE_URL -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d '{
        "agentHost": "'$AGENT_HOST'",
        "agentPort": 443,
        "sslEnabled": true
    }')

    echo "Agent creation response: $AGENT_RESPONSE"
}

# Function to get the list of images
get_image_list() {
    IMAGE_LIST_RESPONSE=$(curl -s -X GET $IMAGE_LIST_URL -H "Authorization: Bearer $TOKEN")
    IMAGES=$(echo $IMAGE_LIST_RESPONSE | jq -c '.data.images[]')
}

# Function to pull images
pull_images() {
    echo "Pulling images..."
    for IMAGE in $IMAGES; do
        IMAGE_REPO=$(echo $IMAGE | jq -r '.imageRepo')
        IMAGE_TAG=$(echo $IMAGE | jq -r '.imageTag')
        echo "Pulling image: $IMAGE_REPO:$IMAGE_TAG"
        docker pull $IMAGE_REPO:$IMAGE_TAG
    done
    echo "All images pulled successfully."
}

create_network_if_not_exists() {
  local network_name="workspaces-proxy-network"

  # Check if the network exists
  if ! docker network inspect "$network_name" >/dev/null 2>&1; then
    # Network does not exist, create it
    docker network create "$network_name"
    echo "Network '$network_name' created."
  else
    # Network exists
    echo "Network '$network_name' already exists."
  fi
}

# Main script execution
main() {
    # Prompt user for credentials and API base URLs
    read -p "Enter the domain name: " DOMAIN
    read -p "Enter your email address: " EMAIL
    read -p "Enter API base URL for authentication (e.g., http://localhost:5000): " AUTH_BASE_URL
    read -p "Enter API base URL for agent creation and image list (e.g., http://localhost:5001): " API_BASE_URL
    read -p "Enter clientId: " CLIENT_ID
    read -p "Enter clientSecret: " CLIENT_SECRET


    SOURCE_DIR="."
    HAPROXY_DIR="./haproxy"

    # Construct full API endpoints
    AUTH_URL="$AUTH_BASE_URL/api/v1/auth/token"
    AGENT_CREATE_URL="$API_BASE_URL/api/v1/agents/create"
    IMAGE_LIST_URL="$API_BASE_URL/api/v1/images/list"

    install_certbot_if_needed
    install_docker_if_needed

    obtain_ssl_certificates
    # create_haproxy_config
    create_docker_compose_file
    create_network_if_not_exists


    echo "Docker Compose and HAProxy configuration files have been created successfully."
    echo "You can now run 'docker-compose up -d' to start the services."

    docker login ghcr.io

    read -p "Do you want to start the services now? (y/n): " start_now
    if [[ "$start_now" == "y" ]]; then
        jq 'del(.nodemonConfig.env) | (.. | select(type == "string")) |= sub("../"; "./")' package.json > temp.json && mv temp.json package.json
        cp -a ../workspaces-micro-commons .
        docker-compose up -d --build --remove-orphans
    fi

    install_jq_if_needed
    generate_token
    create_agent
    get_image_list
    pull_images
}

# Execute the main function
main