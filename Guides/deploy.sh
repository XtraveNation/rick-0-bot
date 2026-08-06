#!/bin/bash
# rick-0-bot deployment automation script
# Usage: bash deploy.sh
# This script automates most of the deployment process for beginners

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "╔════════════════════════════════════════════╗"
echo "║  RickiA Deployment Automation Script v1.0  ║"
echo "║  Deploying rick-0-bot to your server       ║"
echo "╚════════════════════════════════════════════╝"
echo -e "${NC}"

# Check for Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}✗ Docker not found. Install Docker first:${NC}"
    echo "  Ubuntu/Debian: sudo apt install docker.io"
    echo "  macOS: brew install docker"
    exit 1
fi

echo -e "${GREEN}✓ Docker found: $(docker --version)${NC}"

# Check for Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}✗ Docker Compose not found. Install Docker Compose first:${NC}"
    echo "  Ubuntu/Debian: sudo apt install docker-compose"
    echo "  macOS: brew install docker-compose"
    exit 1
fi

echo -e "${GREEN}✓ Docker Compose found: $(docker-compose --version)${NC}"

# Check if .env files exist
echo -e "\n${BLUE}Checking configuration files...${NC}"

if [ ! -f "backend/.env" ]; then
    echo -e "${YELLOW}⚠ backend/.env not found, creating from template...${NC}"
    if [ -f "backend/.env.example" ]; then
        cp backend/.env.example backend/.env
        echo -e "${GREEN}✓ Created backend/.env${NC}"
    else
        echo -e "${RED}✗ backend/.env.example not found${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✓ backend/.env exists${NC}"
fi

if [ ! -f "frontend/.env" ]; then
    echo -e "${YELLOW}⚠ frontend/.env not found, creating from template...${NC}"
    if [ -f "frontend/.env.example" ]; then
        cp frontend/.env.example frontend/.env
        echo -e "${GREEN}✓ Created frontend/.env${NC}"
    else
        echo -e "${RED}✗ frontend/.env.example not found${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✓ frontend/.env exists${NC}"
fi

# Check if API key is set
echo -e "\n${BLUE}Checking API keys...${NC}"

if grep -q "OPENAI_API_KEY=sk-" backend/.env; then
    echo -e "${GREEN}✓ OpenAI API key appears to be set${NC}"
else
    echo -e "${YELLOW}⚠ OpenAI API key not set in backend/.env${NC}"
    echo -e "  Get one free at: https://platform.openai.com/api-keys"
    echo -e "  Then edit: nano backend/.env"
    read -p "Continue without setting it now? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Build Docker images
echo -e "\n${BLUE}Building Docker images...${NC}"
echo -e "${YELLOW}This may take 2-3 minutes...${NC}"

if docker-compose build; then
    echo -e "${GREEN}✓ Docker images built successfully${NC}"
else
    echo -e "${RED}✗ Docker build failed${NC}"
    exit 1
fi

# Start services
echo -e "\n${BLUE}Starting services...${NC}"

if docker-compose up -d; then
    echo -e "${GREEN}✓ Services started${NC}"
else
    echo -e "${RED}✗ Failed to start services${NC}"
    exit 1
fi

# Wait for services to be healthy
echo -e "\n${BLUE}Waiting for services to be healthy...${NC}"
sleep 5

HEALTHY=0
ATTEMPTS=0
MAX_ATTEMPTS=30

while [ $HEALTHY -eq 0 ] && [ $ATTEMPTS -lt $MAX_ATTEMPTS ]; do
    HEALTHY_COUNT=$(docker-compose ps | grep -c "healthy" || true)
    if [ "$HEALTHY_COUNT" -eq "3" ]; then
        HEALTHY=1
    else
        echo -e "${YELLOW}Waiting... ($((ATTEMPTS + 1))/$MAX_ATTEMPTS)${NC}"
        sleep 1
        ((ATTEMPTS++))
    fi
done

if [ $HEALTHY -eq 0 ]; then
    echo -e "${YELLOW}⚠ Services not fully healthy yet, but continuing...${NC}"
else
    echo -e "${GREEN}✓ All services are healthy${NC}"
fi

# Verify deployment
echo -e "\n${BLUE}Verifying deployment...${NC}"

if docker-compose ps | grep -q "Up"; then
    echo -e "${GREEN}✓ Services are running${NC}"
else
    echo -e "${RED}✗ Services are not running${NC}"
    exit 1
fi

# Get server IP
SERVER_IP=$(hostname -I | awk '{print $1}')
if [ -z "$SERVER_IP" ]; then
    SERVER_IP="localhost"
fi

# Show results
echo -e "\n${GREEN}"
echo "╔════════════════════════════════════════════╗"
echo "║  ✓ Deployment Complete!                   ║"
echo "╚════════════════════════════════════════════╝"
echo -e "${NC}"

echo -e "\n${BLUE}Access your application:${NC}"
echo -e "  Frontend: ${GREEN}http://$SERVER_IP:3000${NC}"
echo -e "  Backend API: ${GREEN}http://$SERVER_IP:5000${NC}"
echo -e "  Backend Health: ${GREEN}http://$SERVER_IP:5000/api/health${NC}"

echo -e "\n${BLUE}Useful commands:${NC}"
echo -e "  View status: ${YELLOW}docker-compose ps${NC}"
echo -e "  View logs: ${YELLOW}docker-compose logs -f${NC}"
echo -e "  Stop services: ${YELLOW}docker-compose down${NC}"
echo -e "  Start services: ${YELLOW}docker-compose up -d${NC}"
echo -e "  Restart: ${YELLOW}docker-compose restart${NC}"

echo -e "\n${BLUE}Next steps:${NC}"
echo -e "  1. Open http://$SERVER_IP:3000 in your browser"
echo -e "  2. Add your OpenAI API key in backend/.env if not done"
echo -e "  3. Restart backend: ${YELLOW}docker-compose restart backend${NC}"
echo -e "  4. Try a test message on the Rick tab"

echo -e "\n${BLUE}Need help?${NC}"
echo -e "  See: DEPLOYMENT_FOR_BEGINNERS.md"
echo -e "  See: DEPLOYMENT_QUICK_REFERENCE.md"
echo -e "  GitHub: https://github.com/XtraveNation/rick-0-bot/issues"

echo -e "\n${GREEN}Happy deploying! 🚀${NC}\n"
