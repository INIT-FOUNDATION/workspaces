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
        sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
    else
        echo "Docker is already installed."
    fi
}

# Function to check if Docker Compose is installed and install it if not
install_docker_compose_if_needed() {
    if ! command -v docker-compose &> /dev/null; then
        echo "Docker Compose not found, installing..."
        sudo curl -L "https://github.com/docker/compose/releases/download/$(curl -s https://api.github.com/repos/docker/compose/releases/latest | grep -Po '\"tag_name\": \"\K[^\"]*')" -o /usr/local/bin/docker-compose
        sudo chmod +x /usr/local/bin/docker-compose
        sudo ln -s /usr/local/bin/docker-compose /usr/bin/docker-compose
    else
        echo "Docker Compose is already installed."
    fi
}

# Function to obtain SSL certificates using Certbot
obtain_ssl_certificates() {
    sudo certbot certonly --standalone -d $DOMAIN --non-interactive --agree-tos --email $EMAIL
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
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock

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

# Main script execution
main() {
    # Prompt user for credentials and API base URLs
    read -p "Enter the domain name: " DOMAIN
    read -p "Enter your email address: " EMAIL
    read -p "Enter API base URL for authentication (e.g., http://localhost:5000): " AUTH_BASE_URL
    read -p "Enter API base URL for agent creation and image list (e.g., http://localhost:5001): " API_BASE_URL
    read -p "Enter clientId: " CLIENT_ID
    read -sp "Enter clientSecret: " CLIENT_SECRET
    echo
    read -p "Enter agentHost: " AGENT_HOST

    SOURCE_DIR="."
    HAPROXY_DIR="./haproxy"

    # Construct full API endpoints
    AUTH_URL="$AUTH_BASE_URL/api/v1/auth/token"
    AGENT_CREATE_URL="$API_BASE_URL/api/v1/agents/create"
    IMAGE_LIST_URL="$API_BASE_URL/api/v1/images/list"

    install_certbot_if_needed
    install_docker_if_needed
    install_docker_compose_if_needed

    obtain_ssl_certificates
    create_haproxy_config
    create_docker_compose_file

    echo "Docker Compose and HAProxy configuration files have been created successfully."
    echo "You can now run 'docker-compose up -d' to start the services."

    docker login ghcr.io

    read -p "Do you want to start the services now? (y/n): " start_now
    if [[ "$start_now" == "y" ]]; then
        docker-compose up -d
    fi

    install_jq_if_needed
    generate_token
    create_agent
    get_image_list
    pull_images
}

# Execute the main function
main