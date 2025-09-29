#!/bin/bash

# NASA KisanAI AR Interface Stop Script
# Safely stops all running services

set -e

echo "🛑 Stopping NASA KisanAI AR Interface Services"
echo "=============================================="

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

# Function to stop a service by PID file
stop_service() {
    local service_name=$1
    local pid_file=$2

    if [[ -f "$pid_file" ]]; then
        local pid=$(cat "$pid_file")
        log_info "Stopping $service_name (PID: $pid)..."

        if kill -0 $pid 2>/dev/null; then
            kill -TERM $pid
            sleep 2

            # Check if process is still running
            if kill -0 $pid 2>/dev/null; then
                log_warning "$service_name did not stop gracefully, forcing shutdown..."
                kill -KILL $pid
                sleep 1
            fi

            if kill -0 $pid 2>/dev/null; then
                log_error "Failed to stop $service_name"
                return 1
            else
                log_success "$service_name stopped successfully"
                rm -f "$pid_file"
                return 0
            fi
        else
            log_warning "$service_name was not running (stale PID file)"
            rm -f "$pid_file"
            return 0
        fi
    else
        log_info "No PID file found for $service_name"
        return 0
    fi
}

# Function to stop services by port
stop_by_port() {
    local port=$1
    local service_name=$2

    local pids=$(lsof -ti:$port 2>/dev/null || true)
    if [[ -n "$pids" ]]; then
        log_info "Stopping processes on port $port ($service_name)..."
        for pid in $pids; do
            log_info "Killing process $pid on port $port"
            kill -TERM $pid 2>/dev/null || true
        done
        sleep 2

        # Force kill if still running
        pids=$(lsof -ti:$port 2>/dev/null || true)
        if [[ -n "$pids" ]]; then
            for pid in $pids; do
                log_warning "Force killing process $pid on port $port"
                kill -KILL $pid 2>/dev/null || true
            done
        fi

        log_success "Port $port cleared"
    else
        log_info "No processes found on port $port"
    fi
}

# Main stop function
main() {
    log_info "Starting shutdown process at $(date)"

    # Log the stop action
    mkdir -p logs
    echo "$(date): Stop script executed" >> logs/deployment.log

    # Stop services by PID files
    stop_service "NASA Proxy Server" "./pids/nasa-proxy.pid"
    stop_service "Web Application" "./pids/webapp.pid"

    # Ensure ports are cleared
    stop_by_port 3001 "NASA Proxy"
    stop_by_port 3000 "Web Application"

    # Clean up PID directory
    if [[ -d "./pids" ]]; then
        rm -rf ./pids/*
        log_success "PID files cleaned up"
    fi

    # Final verification
    log_info "Verifying services are stopped..."

    if curl -s http://localhost:3001/api/health >/dev/null 2>&1; then
        log_error "NASA Proxy Server is still responding"
    else
        log_success "NASA Proxy Server stopped"
    fi

    if curl -s http://localhost:3000 >/dev/null 2>&1; then
        log_error "Web Application is still responding"
    else
        log_success "Web Application stopped"
    fi

    echo ""
    echo "🏁 Shutdown Complete!"
    echo "==================="
    echo ""
    echo "All services have been stopped."
    echo "To restart: ./deploy.sh"
    echo ""

    log_info "Shutdown completed at $(date)"
    echo "$(date): Shutdown completed" >> logs/deployment.log
}

# Trap to handle interruption
cleanup_on_exit() {
    log_info "Stop script interrupted"
    exit 1
}

trap cleanup_on_exit INT TERM

# Run main function
main "$@"