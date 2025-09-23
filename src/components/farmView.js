class FarmView {
    constructor(canvasId, gameEngine) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.gameEngine = gameEngine;

        this.selectedZones = [];
        this.isSelecting = false;
        this.selectionStart = null;
        this.selectionEnd = null;

        this.init();
    }

    init() {
        this.bindEvents();
        this.render();

        this.gameEngine.on('toolChanged', (data) => this.onToolChanged(data));
        this.gameEngine.on('weekAdvanced', () => this.render());
        this.gameEngine.on('irrigationApplied', () => this.render());
    }

    bindEvents() {
        this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.onMouseUp(e));
        this.canvas.addEventListener('click', (e) => this.onCanvasClick(e));

        // Add mouse coordinate tracking
        this.canvas.addEventListener('mousemove', (e) => this.showMouseCoordinates(e));
        this.canvas.addEventListener('mouseleave', () => this.hideMouseCoordinates());

        // Create coordinate display element
        this.createCoordinateDisplay();
    }

    createCoordinateDisplay() {
        this.coordDisplay = document.createElement('div');
        this.coordDisplay.id = 'mouse-coordinates';
        this.coordDisplay.style.cssText = `
            position: absolute;
            background: rgba(0,0,0,0.8);
            color: white;
            padding: 5px 10px;
            border-radius: 4px;
            font-family: monospace;
            font-size: 12px;
            pointer-events: none;
            z-index: 1000;
            display: none;
        `;
        document.body.appendChild(this.coordDisplay);
    }

    showMouseCoordinates(e) {
        const rect = this.canvas.getBoundingClientRect();
        const { x, y } = this.getCanvasCoordinates(e);
        const gridX = Math.floor(x / 80);
        const gridY = Math.floor(y / 60);

        this.coordDisplay.innerHTML = `
            Raw: (${Math.round(e.clientX - rect.left)}, ${Math.round(e.clientY - rect.top)})<br>
            Canvas: (${Math.round(x)}, ${Math.round(y)})<br>
            Grid: (${gridX}, ${gridY})<br>
            Zone: zone_${gridX}_${gridY}
        `;

        this.coordDisplay.style.display = 'block';
        this.coordDisplay.style.left = (e.clientX + 10) + 'px';
        this.coordDisplay.style.top = (e.clientY - 60) + 'px';
    }

    hideMouseCoordinates() {
        this.coordDisplay.style.display = 'none';
    }

    getCanvasCoordinates(e) {
        const rect = this.canvas.getBoundingClientRect();

        // Get computed styles to account for border
        const computedStyle = getComputedStyle(this.canvas);
        const borderLeft = parseFloat(computedStyle.borderLeftWidth) || 0;
        const borderTop = parseFloat(computedStyle.borderTopWidth) || 0;

        // Calculate the actual canvas content area (excluding borders)
        const canvasContentWidth = rect.width - (borderLeft * 2);
        const canvasContentHeight = rect.height - (borderTop * 2);

        // Account for canvas scaling - this handles responsive design
        const scaleX = this.canvas.width / canvasContentWidth;
        const scaleY = this.canvas.height / canvasContentHeight;

        // Subtract border offset from raw coordinates
        const rawX = e.clientX - rect.left - borderLeft;
        const rawY = e.clientY - rect.top - borderTop;

        const x = rawX * scaleX;
        const y = rawY * scaleY;

        // Debug: Log all coordinate info
        console.log('Coordinate Debug:', {
            clientX: e.clientX,
            clientY: e.clientY,
            rectLeft: rect.left,
            rectTop: rect.top,
            rectWidth: rect.width,
            rectHeight: rect.height,
            borderLeft: borderLeft,
            borderTop: borderTop,
            canvasContentWidth: canvasContentWidth,
            canvasContentHeight: canvasContentHeight,
            canvasWidth: this.canvas.width,
            canvasHeight: this.canvas.height,
            scaleX: scaleX,
            scaleY: scaleY,
            rawX: rawX,
            rawY: rawY,
            finalX: x,
            finalY: y,
            expectedGrid: `${Math.floor(x/80)}_${Math.floor(y/60)}`
        });

        return { x, y };
    }

    onMouseDown(e) {
        const { x, y } = this.getCanvasCoordinates(e);

        if (this.gameEngine.state.selectedTool === 'irrigate' || this.gameEngine.state.selectedTool === 'fertilize') {
            this.isSelecting = true;
            this.selectionStart = { x, y };
            this.selectionEnd = { x, y };
        }
    }

    onMouseMove(e) {
        if (!this.isSelecting) return;

        const { x, y } = this.getCanvasCoordinates(e);

        this.selectionEnd = { x, y };
        this.render();
        this.drawSelection();
    }

    onMouseUp(e) {
        if (!this.isSelecting) return;

        this.isSelecting = false;
        this.finalizeSelection();
        this.render();
    }

    onCanvasClick(e) {
        console.log('Canvas clicked!'); // Debug log
        const rect = this.canvas.getBoundingClientRect();
        const rawX = e.clientX - rect.left;
        const rawY = e.clientY - rect.top;

        const { x, y } = this.getCanvasCoordinates(e);

        console.log('Raw click:', rawX, rawY);
        console.log('Canvas rect:', rect.width, rect.height, 'vs canvas:', this.canvas.width, this.canvas.height);
        console.log('Calculated position:', x, y);
        console.log('Expected grid position:', Math.floor(x/80), Math.floor(y/60));

        const zone = this.getZoneAtPosition(x, y);
        if (!zone) {
            console.log('No zone found at position', x, y);
            // Show nearby zones for debugging
            const farmData = this.gameEngine.getFarmData();
            const nearbyZones = farmData.zones.filter(z =>
                Math.abs(z.x - x) < 100 && Math.abs(z.y - y) < 100
            );
            console.log('Nearby zones:', nearbyZones.map(z => ({
                id: z.id,
                x: z.x,
                y: z.y,
                distance: Math.sqrt((z.x - x)**2 + (z.y - y)**2)
            })));
            return;
        }

        const tool = this.gameEngine.state.selectedTool;
        console.log('Canvas click - tool:', tool, 'zone:', zone.id); // Debug log

        switch (tool) {
            case 'inspect':
                console.log('Inspecting zone:', zone.id); // Debug log
                this.showZoneInfo(zone);
                break;
            case 'irrigate':
                console.log('Irrigating zone:', zone.id); // Debug log
                this.applyIrrigation([zone]);
                break;
            case 'fertilize':
                console.log('Fertilizing zone:', zone.id); // Debug log
                this.applyFertilizer([zone]);
                break;
            default:
                console.log('Unknown tool:', tool); // Debug log
        }
    }

    onToolChanged(data) {
        this.selectedZones = [];
        this.canvas.style.cursor = this.getCursorForTool(data.tool);
    }

    getCursorForTool(tool) {
        switch (tool) {
            case 'inspect': return 'help';
            case 'irrigate': return 'crosshair';
            case 'fertilize': return 'crosshair';
            case 'livestock': return 'move';
            default: return 'default';
        }
    }

    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.drawBackground();
        this.drawZones();
        this.drawLegend();
    }

    drawBackground() {
        // Draw farm field background
        this.ctx.fillStyle = '#8BC34A';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw field border
        this.ctx.strokeStyle = '#4CAF50';
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(0, 0, this.canvas.width, this.canvas.height);
    }

    drawZones() {
        const farmData = this.gameEngine.getFarmData();

        farmData.zones.forEach(zone => {
            this.drawZone(zone);
        });

        // Add grid debugging overlay
        this.drawGridOverlay();
    }

    drawGridOverlay() {
        // Draw grid lines and coordinates for debugging
        this.ctx.strokeStyle = 'rgba(255, 0, 0, 0.3)';
        this.ctx.lineWidth = 1;
        this.ctx.font = '10px Arial';
        this.ctx.fillStyle = 'red';
        this.ctx.textAlign = 'center';

        // Draw vertical grid lines
        for (let x = 0; x <= 10; x++) {
            const xPos = x * 80;
            this.ctx.beginPath();
            this.ctx.moveTo(xPos, 0);
            this.ctx.lineTo(xPos, 600);
            this.ctx.stroke();

            if (x < 10) {
                this.ctx.fillText(x.toString(), xPos + 40, 15);
            }
        }

        // Draw horizontal grid lines
        for (let y = 0; y <= 10; y++) {
            const yPos = y * 60;
            this.ctx.beginPath();
            this.ctx.moveTo(0, yPos);
            this.ctx.lineTo(800, yPos);
            this.ctx.stroke();

            if (y < 10) {
                this.ctx.fillText(y.toString(), 15, yPos + 35);
            }
        }

        // Draw zone IDs in the center of each zone
        const farmData = this.gameEngine.getFarmData();
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.font = 'bold 12px Arial';
        farmData.zones.forEach(zone => {
            const centerX = zone.x + zone.width / 2;
            const centerY = zone.y + zone.height / 2;
            this.ctx.fillText(zone.id.replace('zone_', ''), centerX, centerY);
        });
    }

    drawZone(zone) {
        const { x, y, width, height, ndvi, soilMoisture, stressLevel, hasIrrigation } = zone;

        // Determine zone color based on NDVI and stress
        let fillColor = this.getNDVIColor(ndvi);

        if (stressLevel === 'high') {
            fillColor = '#FF5722'; // Red for high stress
        } else if (stressLevel === 'moderate') {
            fillColor = '#FF9800'; // Orange for moderate stress
        }

        // Draw zone
        this.ctx.fillStyle = fillColor;
        this.ctx.fillRect(x, y, width, height);

        // Draw zone border
        this.ctx.strokeStyle = '#2E7D32';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(x, y, width, height);

        // Draw irrigation indicator
        if (hasIrrigation) {
            this.ctx.fillStyle = 'rgba(33, 150, 243, 0.7)';
            this.ctx.fillRect(x + 5, y + 5, width - 10, height - 10);

            // Draw water droplet icon
            this.drawWaterDroplet(x + width/2, y + height/2);
        }

        // Draw fertilizer indicator
        if (zone.hasFertilizer) {
            // Draw green sparkles/plus signs to indicate fertilizer
            this.ctx.strokeStyle = '#4CAF50';
            this.ctx.lineWidth = 2;

            // Draw nutrient symbols (N+)
            this.ctx.font = 'bold 12px Arial';
            this.ctx.fillStyle = '#2E7D32';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('N+', x + width - 15, y + 15);

            // Draw green border effect
            this.ctx.strokeStyle = 'rgba(76, 175, 80, 0.8)';
            this.ctx.lineWidth = 2;
            this.ctx.setLineDash([3, 3]);
            this.ctx.strokeRect(x + 2, y + 2, width - 4, height - 4);
            this.ctx.setLineDash([]);
        }

        // Draw NDVI value (for debugging/educational purposes)
        if (this.gameEngine.state.selectedTool === 'inspect') {
            this.ctx.fillStyle = '#000';
            this.ctx.font = '10px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(ndvi.toFixed(2), x + width/2, y + height/2);
        }
    }

    getNDVIColor(ndvi) {
        // Convert NDVI value (0-1) to color gradient
        if (ndvi < 0.3) return '#8D6E63'; // Brown - bare soil
        if (ndvi < 0.4) return '#FFC107'; // Yellow - stressed vegetation
        if (ndvi < 0.6) return '#8BC34A'; // Light green - moderate vegetation
        return '#4CAF50'; // Dark green - healthy vegetation
    }

    drawWaterDroplet(x, y) {
        this.ctx.fillStyle = '#2196F3';
        this.ctx.beginPath();
        this.ctx.arc(x, y, 8, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.fillStyle = '#0D47A1';
        this.ctx.beginPath();
        this.ctx.arc(x - 2, y - 2, 3, 0, Math.PI * 2);
        this.ctx.fill();
    }

    drawSelection() {
        if (!this.selectionStart || !this.selectionEnd) return;

        const x = Math.min(this.selectionStart.x, this.selectionEnd.x);
        const y = Math.min(this.selectionStart.y, this.selectionEnd.y);
        const width = Math.abs(this.selectionEnd.x - this.selectionStart.x);
        const height = Math.abs(this.selectionEnd.y - this.selectionStart.y);

        this.ctx.strokeStyle = '#2196F3';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 5]);
        this.ctx.strokeRect(x, y, width, height);

        this.ctx.fillStyle = 'rgba(33, 150, 243, 0.2)';
        this.ctx.fillRect(x, y, width, height);

        this.ctx.setLineDash([]);
    }

    drawLegend() {
        const legendX = 10;
        const legendY = 10;
        const legendWidth = 300;
        const legendHeight = 150;

        // Legend background with shadow effect
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        this.ctx.shadowBlur = 8;
        this.ctx.shadowOffsetX = 2;
        this.ctx.shadowOffsetY = 2;

        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        this.ctx.fillRect(legendX, legendY, legendWidth, legendHeight);

        // Reset shadow for border
        this.ctx.shadowBlur = 0;
        this.ctx.shadowOffsetX = 0;
        this.ctx.shadowOffsetY = 0;

        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(legendX, legendY, legendWidth, legendHeight);

        // Legend title
        this.ctx.fillStyle = '#000';
        this.ctx.font = 'bold 14px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'top';
        this.ctx.fillText('NDVI Vegetation Health', legendX + 15, legendY + 12);

        // Legend items
        const legendItems = [
            { color: '#8D6E63', label: 'Bare Soil / Dead (< 0.3)' },
            { color: '#FFC107', label: 'Stressed Vegetation (0.3-0.4)' },
            { color: '#8BC34A', label: 'Moderate Health (0.4-0.6)' },
            { color: '#4CAF50', label: 'Healthy Vegetation (> 0.6)' }
        ];

        // Item positioning
        const itemStartY = legendY + 40;
        const itemHeight = 25;
        const colorBoxX = legendX + 15;
        const colorBoxWidth = 24;
        const colorBoxHeight = 16;
        const textX = colorBoxX + colorBoxWidth + 8; // 8px padding between box and text

        this.ctx.font = '12px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'middle';

        legendItems.forEach((item, index) => {
            const itemY = itemStartY + (index * itemHeight);
            const boxY = itemY - colorBoxHeight / 2;

            // Color swatch
            this.ctx.fillStyle = item.color;
            this.ctx.fillRect(colorBoxX, boxY, colorBoxWidth, colorBoxHeight);

            // Color swatch border
            this.ctx.strokeStyle = '#000';
            this.ctx.lineWidth = 1;
            this.ctx.strokeRect(colorBoxX, boxY, colorBoxWidth, colorBoxHeight);

            // Label text - vertically centered with the color box
            this.ctx.fillStyle = '#000';
            this.ctx.fillText(item.label, textX, itemY);
        });

        // Reset text alignment to default
        this.ctx.textAlign = 'start';
        this.ctx.textBaseline = 'alphabetic';
    }

    finalizeSelection() {
        if (!this.selectionStart || !this.selectionEnd) return;

        const x = Math.min(this.selectionStart.x, this.selectionEnd.x);
        const y = Math.min(this.selectionStart.y, this.selectionEnd.y);
        const width = Math.abs(this.selectionEnd.x - this.selectionStart.x);
        const height = Math.abs(this.selectionEnd.y - this.selectionStart.y);

        const selectedZones = this.getZonesInSelection(x, y, width, height);

        if (selectedZones.length > 0) {
            this.applyCurrentTool(selectedZones);
        }

        this.selectionStart = null;
        this.selectionEnd = null;
    }

    getZonesInSelection(x, y, width, height) {
        const farmData = this.gameEngine.getFarmData();
        return farmData.zones.filter(zone => {
            return zone.x < x + width &&
                   zone.x + zone.width > x &&
                   zone.y < y + height &&
                   zone.y + zone.height > y;
        });
    }

    getZoneAtPosition(x, y) {
        const farmData = this.gameEngine.getFarmData();

        // Find zone using grid-based calculation first (more reliable)
        const gridX = Math.floor(x / 80);
        const gridY = Math.floor(y / 60);
        const expectedZoneId = `zone_${gridX}_${gridY}`;

        // Try grid-based lookup first
        const gridZone = farmData.zones.find(zone => zone.id === expectedZoneId);
        if (gridZone) {
            console.log(`Grid-based lookup found: ${expectedZoneId} at grid(${gridX},${gridY})`);
            return gridZone;
        }

        // Fallback to boundary-based detection
        const boundaryZone = farmData.zones.find(zone =>
            x >= zone.x && x < zone.x + zone.width &&
            y >= zone.y && y < zone.y + zone.height
        );

        if (boundaryZone) {
            console.log(`Boundary-based lookup found: ${boundaryZone.id}`);
        } else {
            console.log(`No zone found for click at (${x}, ${y}) - grid(${gridX},${gridY})`);
        }

        return boundaryZone;
    }

    applyCurrentTool(zones) {
        const tool = this.gameEngine.state.selectedTool;
        console.log('Applying current tool:', tool, 'to', zones.length, 'zones'); // Debug log

        switch (tool) {
            case 'irrigate':
                this.applyIrrigation(zones);
                break;
            case 'fertilize':
                console.log('Calling applyFertilizer with zones:', zones.length); // Debug log
                this.applyFertilizer(zones);
                break;
        }
    }

    applyIrrigation(zones) {
        let totalCost = zones.length * 25; // 25L per zone
        let appliedZones = 0;

        for (const zone of zones) {
            if (this.gameEngine.applyIrrigationToZone(zone)) {
                appliedZones++;
            } else {
                break; // Stop if we run out of water
            }
        }

        if (appliedZones > 0) {
            this.showActionFeedback(`Irrigation applied to ${appliedZones} zones. Water saved: ${(zones.length - appliedZones) * 25}L`);
        } else {
            this.showActionFeedback('Not enough water budget for irrigation!');
        }
    }

    applyFertilizer(zones) {
        console.log('applyFertilizer called with', zones.length, 'zones'); // Debug log
        console.log('Current fertilizer budget:', this.gameEngine.state.fertilizerBudget); // Debug log

        let totalCost = zones.length * 10; // 10kg per zone
        let appliedZones = 0;
        let lowNDVIZones = 0;

        for (const zone of zones) {
            // Prioritize zones with low NDVI
            if (zone.ndvi < 0.5 && !zone.hasFertilizer) {
                if (this.gameEngine.applyFertilizerToZone(zone)) {
                    appliedZones++;
                    if (zone.ndvi < 0.4) {
                        lowNDVIZones++;
                    }
                } else {
                    break; // Stop if we run out of fertilizer
                }
            }
        }

        // Apply to other zones if budget allows
        for (const zone of zones) {
            if (!zone.hasFertilizer) {
                if (this.gameEngine.applyFertilizerToZone(zone)) {
                    appliedZones++;
                } else {
                    break;
                }
            }
        }

        if (appliedZones > 0) {
            const message = lowNDVIZones > 0
                ? `Fertilizer applied to ${appliedZones} zones (${lowNDVIZones} stressed zones prioritized). Vegetation health improved!`
                : `Fertilizer applied to ${appliedZones} zones. NDVI increased by ~15%.`;
            this.showActionFeedback(message);
        } else {
            this.showActionFeedback('Not enough fertilizer budget! Need 10kg per zone.');
        }

        // Refresh the view to show changes
        this.render();
    }

    showZoneInfo(zone) {
        const fertilizeStatus = zone.hasFertilizer ? 'Applied' : 'Not Applied';
        const irrigationStatus = zone.hasIrrigation ? 'Recently Irrigated' : 'Not Irrigated';

        const info = `
Zone Information:
━━━━━━━━━━━━━━━
NDVI Health: ${zone.ndvi.toFixed(3)} (${this.getNDVIHealthStatus(zone.ndvi)})
Soil Moisture: ${(zone.soilMoisture * 100).toFixed(1)}%
Stress Level: ${zone.stressLevel}
Irrigation: ${irrigationStatus}
Fertilizer: ${fertilizeStatus}
${zone.hasFertilizer ? `Applied in Week: ${zone.fertilizerAppliedWeek || 'Unknown'}` : ''}

Recommendations:
${this.getZoneRecommendations(zone)}
        `;

        alert(info); // In a real implementation, this would be a proper modal
    }

    getNDVIHealthStatus(ndvi) {
        if (ndvi > 0.7) return 'Excellent';
        if (ndvi > 0.5) return 'Good';
        if (ndvi > 0.3) return 'Fair';
        return 'Poor';
    }

    getZoneRecommendations(zone) {
        const recommendations = [];

        if (zone.ndvi < 0.4 && !zone.hasFertilizer) {
            recommendations.push('• Consider applying fertilizer to improve vegetation health');
        }
        if (zone.soilMoisture < 0.25 && !zone.hasIrrigation) {
            recommendations.push('• Irrigation recommended due to low soil moisture');
        }
        if (zone.ndvi > 0.7 && zone.hasFertilizer) {
            recommendations.push('• Healthy zone - no immediate action needed');
        }
        if (zone.stressLevel === 'high') {
            recommendations.push('• URGENT: Address high stress immediately');
        }

        return recommendations.length > 0 ? recommendations.join('\n') : '• Zone is in acceptable condition';
    }

    showActionFeedback(message) {
        // Create temporary feedback element
        const feedback = document.createElement('div');
        feedback.textContent = message;
        feedback.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0,0,0,0.8);
            color: white;
            padding: 1rem 2rem;
            border-radius: 4px;
            z-index: 9999;
            font-weight: bold;
        `;

        document.body.appendChild(feedback);

        setTimeout(() => {
            document.body.removeChild(feedback);
        }, 3000);
    }
}