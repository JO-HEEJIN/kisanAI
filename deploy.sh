#!/bin/bash

# NASA KisanAI AR Interface Deployment Script
# This script sets up and deploys the complete AR interface system

set -e  # Exit on any error

echo "🚀 NASA KisanAI AR Interface Deployment"
echo "======================================="

# Configuration
PROJECT_NAME="kisanAI"
BACKUP_DIR="./backups/$(date +%Y%m%d_%H%M%S)"
REQUIRED_PORTS=(3000 3001)

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Function to check if a port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null ; then
        return 0  # Port is in use
    else
        return 1  # Port is free
    fi
}

# Function to check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."

    # Check Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js is not installed. Please install Node.js first."
        exit 1
    else
        local node_version=$(node --version)
        log_success "Node.js found: $node_version"
    fi

    # Check npm
    if ! command -v npm &> /dev/null; then
        log_error "npm is not installed. Please install npm first."
        exit 1
    else
        local npm_version=$(npm --version)
        log_success "npm found: $npm_version"
    fi

    # Check if we're in the right directory
    if [[ ! -f "index.html" || ! -d "src/ar" ]]; then
        log_error "Please run this script from the kisanAI project root directory."
        exit 1
    fi

    # Check for required files
    local required_files=(
        "src/ar/ARSystem.js"
        "src/ar/ARIntegrationManager.js"
        "src/ar/TabNavigationGuard.js"
        "src/ar/ARInterfaceManager.js"
        "src/ar/ARSystemExtension.js"
        "server/nasa-proxy.js"
    )

    for file in "${required_files[@]}"; do
        if [[ ! -f "$file" ]]; then
            log_error "Required file missing: $file"
            exit 1
        fi
    done

    log_success "All prerequisites met"
}

# Function to create backup
create_backup() {
    log_info "Creating backup..."

    mkdir -p "$BACKUP_DIR"

    # Backup critical files
    cp -r src/ "$BACKUP_DIR/" 2>/dev/null || true
    cp index.html "$BACKUP_DIR/" 2>/dev/null || true
    cp package.json "$BACKUP_DIR/" 2>/dev/null || true
    cp server/ "$BACKUP_DIR/" -r 2>/dev/null || true

    log_success "Backup created at: $BACKUP_DIR"
}

# Function to install dependencies
install_dependencies() {
    log_info "Installing dependencies..."

    if [[ -f "package.json" ]]; then
        npm install
        log_success "Dependencies installed"
    else
        log_warning "No package.json found, skipping npm install"
    fi
}

# Function to check and kill processes on required ports
prepare_ports() {
    log_info "Preparing ports..."

    for port in "${REQUIRED_PORTS[@]}"; do
        if check_port $port; then
            log_warning "Port $port is in use. Attempting to free it..."

            # Get the PID of the process using the port
            local pid=$(lsof -ti:$port)
            if [[ -n "$pid" ]]; then
                log_info "Killing process $pid on port $port"
                kill -9 $pid 2>/dev/null || true
                sleep 2

                # Check if port is now free
                if check_port $port; then
                    log_error "Failed to free port $port. Please manually stop the process."
                    exit 1
                else
                    log_success "Port $port freed"
                fi
            fi
        else
            log_success "Port $port is available"
        fi
    done
}

# Function to start NASA proxy server
start_nasa_proxy() {
    log_info "Starting NASA proxy server..."

    if [[ ! -f "server/nasa-proxy.js" ]]; then
        log_error "NASA proxy server not found at server/nasa-proxy.js"
        exit 1
    fi

    # Start NASA proxy in background
    cd server
    nohup node nasa-proxy.js > ../logs/nasa-proxy.log 2>&1 &
    local nasa_pid=$!
    cd ..

    # Save PID for later cleanup
    echo $nasa_pid > ./pids/nasa-proxy.pid

    # Wait for server to start
    sleep 3

    # Check if server is running
    if curl -s http://localhost:3001/api/health > /dev/null; then
        log_success "NASA proxy server started (PID: $nasa_pid)"
    else
        log_error "Failed to start NASA proxy server"
        exit 1
    fi
}

# Function to start web application
start_web_app() {
    log_info "Starting web application..."

    # Start web app in background
    nohup npm start > logs/webapp.log 2>&1 &
    local webapp_pid=$!

    # Save PID for later cleanup
    echo $webapp_pid > ./pids/webapp.pid

    # Wait for server to start
    sleep 5

    # Check if server is running
    if curl -s http://localhost:3000 > /dev/null; then
        log_success "Web application started (PID: $webapp_pid)"
    else
        log_error "Failed to start web application"
        exit 1
    fi
}

# Function to run health checks
run_health_checks() {
    log_info "Running health checks..."

    # Check NASA proxy
    if curl -s http://localhost:3001/api/health | grep -q "ok"; then
        log_success "NASA proxy server is healthy"
    else
        log_error "NASA proxy server health check failed"
        return 1
    fi

    # Check web app
    if curl -s http://localhost:3000 | grep -q "AR ChatGPT"; then
        log_success "Web application is healthy"
    else
        log_error "Web application health check failed"
        return 1
    fi

    # Test NASA API endpoints
    local test_lat=33.43
    local test_lon=-111.94

    if curl -s "http://localhost:3001/api/smap/soil-moisture?lat=$test_lat&lon=$test_lon" | grep -q "surface_moisture"; then
        log_success "SMAP API endpoint working"
    else
        log_warning "SMAP API endpoint test failed"
    fi

    if curl -s "http://localhost:3001/api/modis/ndvi?lat=$test_lat&lon=$test_lon" | grep -q "ndvi"; then
        log_success "MODIS API endpoint working"
    else
        log_warning "MODIS API endpoint test failed"
    fi

    # Check monitoring dashboard
    if curl -s http://localhost:3000/ar-monitoring-dashboard.html | grep -q "Monitoring Dashboard"; then
        log_success "Monitoring dashboard accessible"
    else
        log_warning "Monitoring dashboard not accessible"
    fi

    # Check test integration page
    if curl -s http://localhost:3000/test-ar-integration.html | grep -q "Integration Test"; then
        log_success "Integration test page accessible"
    else
        log_warning "Integration test page not accessible"
    fi
}

# Function to setup directories
setup_directories() {
    log_info "Setting up directories..."

    mkdir -p logs
    mkdir -p pids
    mkdir -p backups

    log_success "Directories created"
}

# Function to create systemd service files (for Linux deployment)
create_systemd_services() {
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        log_info "Creating systemd service files..."

        # NASA Proxy Service
        cat > /tmp/kisanai-nasa-proxy.service << EOF
[Unit]
Description=KisanAI NASA Proxy Server
After=network.target

[Service]
Type=simple
User=$(whoami)
WorkingDirectory=$(pwd)/server
ExecStart=$(which node) nasa-proxy.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF

        # Web App Service
        cat > /tmp/kisanai-webapp.service << EOF
[Unit]
Description=KisanAI Web Application
After=network.target kisanai-nasa-proxy.service

[Service]
Type=simple
User=$(whoami)
WorkingDirectory=$(pwd)
ExecStart=$(which npm) start
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF

        log_info "Systemd service files created in /tmp/"
        log_info "To install: sudo cp /tmp/kisanai-*.service /etc/systemd/system/"
        log_info "Then: sudo systemctl enable kisanai-nasa-proxy kisanai-webapp"
    fi
}

# Function to display deployment summary
display_summary() {
    echo ""
    echo "🎉 Deployment Complete!"
    echo "======================"
    echo ""
    echo "📍 Application URLs:"
    echo "   • Main Application: http://localhost:3000"
    echo "   • NASA Proxy API: http://localhost:3001"
    echo "   • Monitoring Dashboard: http://localhost:3000/ar-monitoring-dashboard.html"
    echo "   • Integration Tests: http://localhost:3000/test-ar-integration.html"
    echo ""
    echo "📊 Process Information:"
    if [[ -f "./pids/nasa-proxy.pid" ]]; then
        echo "   • NASA Proxy PID: $(cat ./pids/nasa-proxy.pid)"
    fi
    if [[ -f "./pids/webapp.pid" ]]; then
        echo "   • Web App PID: $(cat ./pids/webapp.pid)"
    fi
    echo ""
    echo "📝 Log Files:"
    echo "   • NASA Proxy: ./logs/nasa-proxy.log"
    echo "   • Web App: ./logs/webapp.log"
    echo ""
    echo "🛠️  Management Commands:"
    echo "   • Stop services: ./stop.sh"
    echo "   • View logs: tail -f logs/*.log"
    echo "   • Health check: curl http://localhost:3001/api/health"
    echo ""
    echo "🔧 AR Interface Features:"
    echo "   • ✅ Independent Babylon.js AR System"
    echo "   • ✅ NASA Data Integration (SMAP, MODIS)"
    echo "   • ✅ Advanced AR Interface with Touch & Voice"
    echo "   • ✅ Real-time Monitoring Dashboard"
    echo "   • ✅ Comprehensive Tab Navigation Protection"
    echo ""
}

# Main deployment function
main() {
    echo "Starting deployment at $(date)"

    # Create log entry
    echo "$(date): Deployment started" >> logs/deployment.log

    check_prerequisites
    setup_directories
    create_backup
    install_dependencies
    prepare_ports
    start_nasa_proxy
    start_web_app

    # Wait a moment for services to fully start
    sleep 3

    run_health_checks
    create_systemd_services
    display_summary

    echo "$(date): Deployment completed successfully" >> logs/deployment.log

    log_success "Deployment completed successfully! 🎉"
}

# Trap to cleanup on script exit
cleanup_on_exit() {
    log_info "Deployment interrupted. Cleaning up..."

    # Kill any started processes
    if [[ -f "./pids/nasa-proxy.pid" ]]; then
        local nasa_pid=$(cat ./pids/nasa-proxy.pid)
        kill -9 $nasa_pid 2>/dev/null || true
        rm -f ./pids/nasa-proxy.pid
    fi

    if [[ -f "./pids/webapp.pid" ]]; then
        local webapp_pid=$(cat ./pids/webapp.pid)
        kill -9 $webapp_pid 2>/dev/null || true
        rm -f ./pids/webapp.pid
    fi

    log_info "Cleanup completed"
    exit 1
}

# Set trap for cleanup
trap cleanup_on_exit INT TERM

# Run main function
main "$@"