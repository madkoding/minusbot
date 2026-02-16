#!/bin/bash

# --- Configuration ---
REPO_URL="https://github.com/sammwyy/minusbot.git"
DEFAULT_CONTAINER_NAME="minusbot"

# --- Visual Setup ---
BLUE='\033[0;34m'
CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BOLD='\033[1m'
NC='\033[0m'

print_header() {
    clear
    echo -e "${BLUE}${BOLD}==================================================${NC}"
    echo -e "${BLUE}${BOLD}               MINUSBOT INSTALLER                 ${NC}"
    echo -e "${BLUE}${BOLD}==================================================${NC}"
    echo ""
}

print_status() {
    echo -e "${CYAN}[*] $1...${NC}"
}

print_success() {
    echo -e "${GREEN}[+] $1!${NC}"
}

print_error() {
    echo -e "${RED}[!] Error: $1${NC}"
    exit 1
}

print_header

# 1. Dependency Checks (Git)
print_status "Checking for Git"
if ! [ -x "$(command -v git)" ]; then
    echo -e "${YELLOW}Git is not installed. Attempting installation...${NC}"
    if [ -f /etc/debian_version ]; then
        sudo apt-get update && sudo apt-get install -y git || print_error "Failed to install git"
    elif [ -f /etc/redhat-release ]; then
        sudo yum install -y git || print_error "Failed to install git"
    else
        print_error "Git is missing and OS not supported for auto-install. Please install git manually."
    fi
fi
print_success "Git is ready"

# 2. Dependency Checks (Docker)
print_status "Checking for Docker"
if ! [ -x "$(command -v docker)" ]; then
    echo -e "${YELLOW}Docker is not installed. Attempting installation...${NC}"
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh || print_error "Failed to install docker"
    rm get-docker.sh
    sudo usermod -aG docker $USER
    echo -e "${YELLOW}Docker installed. You might need to restart your session if permission errors occur.${NC}"
fi
print_success "Docker is ready"

# 3. Interactive Configuration
echo -e "${BOLD}Setup Configuration:${NC}"
read -p "$(echo -e ${CYAN}"Container name [${DEFAULT_CONTAINER_NAME}]: "${NC})" CONTAINER_NAME
CONTAINER_NAME=${CONTAINER_NAME:-$DEFAULT_CONTAINER_NAME}

# 4. Check for local installation
IS_LOCAL=false
if [ -d ".git" ] && [ -f "Dockerfile" ] && [ -f "package.json" ] && [ -f "versions.json" ]; then
    IS_LOCAL=true
    print_success "Local repository detected. Skipping clone."
fi

if [ "$IS_LOCAL" = false ]; then
    # Check if directory exists
    if [ -d "$CONTAINER_NAME" ]; then
        print_error "Directory '$CONTAINER_NAME' already exists. Please remove it or choose another name."
    fi

    # Clone Repository
    print_status "Cloning repository $REPO_URL"
    git clone $REPO_URL $CONTAINER_NAME || print_error "Cloning failed"
    cd $CONTAINER_NAME
fi

# 5. Build Container
print_status "Compiling Docker Container and installing dependencies"
echo -e "${YELLOW}(This might take a few minutes as it builds the frontend)${NC}"
docker build -t "$CONTAINER_NAME" . || print_error "Docker build failed"
print_success "Container compiled successfully"

# 6. Run System (Initial Boot)
print_status "Launching system core"
docker run -d --name "$CONTAINER_NAME" \
    -p 9753:9753 \
    -v "/var/run/docker.sock:/var/run/docker.sock" \
    -v "$HOME/.config/$CONTAINER_NAME:/root/.config/minusbot" \
    "$CONTAINER_NAME" || print_error "Failed to start container"
print_success "System is running in detached mode"

# 7. Skills Installation
echo ""
echo -e "${BOLD}Post-Installation:${NC}"
read -p "$(echo -e ${YELLOW}"Would you like to install additional skills? (Y/n): "${NC})" INSTALL_SKILLS
INSTALL_SKILLS=${INSTALL_SKILLS:-Y}

if [[ "$INSTALL_SKILLS" =~ ^[Yy]$ ]]; then
    print_status "Installing skills registry"
    docker exec -it "$CONTAINER_NAME" bun run skills:install
    print_success "Skills synchronized"
fi

# 8. Admin Reset
print_status "Generating root credentials"
echo -ne "${GREEN}${BOLD}"
docker exec -it "$CONTAINER_NAME" bun run root:reset
echo -ne "${NC}"

echo ""
echo -e "${BLUE}${BOLD}==================================================${NC}"
echo -e "${GREEN}${BOLD}       INSTALLATION COMPLETED SUCCESSFULLY        ${NC}"
echo -e "${BLUE}${BOLD}==================================================${NC}"
echo -e "${CYAN}You can manage your bot using: ${BOLD}docker logs -f $CONTAINER_NAME${NC}"
echo -e "${CYAN}Access the web dashboard at: ${BOLD}http://localhost:9753${NC}"
echo -e "${BLUE}${BOLD}==================================================${NC}"
