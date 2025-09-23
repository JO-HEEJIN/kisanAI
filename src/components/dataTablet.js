class DataTablet {
    constructor(gameEngine, nasaDataService) {
        this.gameEngine = gameEngine;
        this.nasaDataService = nasaDataService;
        this.canvas = document.getElementById('data-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.activeTab = 'ndvi';

        this.mockSatelliteData = this.generateMockSatelliteData();

        this.init();
    }

    init() {
        this.bindEvents();
        this.updateDisplay();

        this.gameEngine.on('dataTabletOpened', () => this.onTabletOpened());
        this.gameEngine.on('weekAdvanced', () => this.updateMockData());
    }

    bindEvents() {
        document.getElementById('close-tablet').addEventListener('click', () => {
            document.getElementById('data-tablet').classList.add('hidden');
        });

        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });
    }

    switchTab(tabName) {
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        this.activeTab = tabName;
        this.updateDisplay();
    }

    onTabletOpened() {
        this.updateDisplay();

        // Show tutorial guidance if in tutorial mode
        if (this.gameEngine.state.gameMode === 'tutorial') {
            setTimeout(() => {
                this.gameEngine.showDrVegaMessage(
                    "This is your Data Tablet! The colors show crop health using NDVI data. Yellow and red areas need attention. Try switching between the data tabs to see different satellite measurements."
                );
            }, 500);
        }
    }

    updateDisplay() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        switch (this.activeTab) {
            case 'ndvi':
                this.displayNDVIData();
                break;
            case 'moisture':
                this.displaySoilMoistureData();
                break;
            case 'precipitation':
                this.displayPrecipitationData();
                break;
        }

        this.drawDataInfo();
    }

    displayNDVIData() {
        const farmData = this.gameEngine.getFarmData();
        const scaleX = this.canvas.width / 800;
        const scaleY = this.canvas.height / 600;

        // Draw title
        this.ctx.fillStyle = '#000';
        this.ctx.font = 'bold 16px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('NDVI - Normalized Difference Vegetation Index', this.canvas.width / 2, 20);

        // Draw zones with NDVI coloring
        farmData.zones.forEach(zone => {
            const x = zone.x * scaleX;
            const y = zone.y * scaleY + 30; // Offset for title
            const width = zone.width * scaleX;
            const height = zone.height * scaleY;

            // Color based on NDVI value
            this.ctx.fillStyle = this.getNDVIColor(zone.ndvi);
            this.ctx.fillRect(x, y, width, height);

            // Draw zone border
            this.ctx.strokeStyle = '#333';
            this.ctx.lineWidth = 0.5;
            this.ctx.strokeRect(x, y, width, height);
        });

        // Draw NDVI scale
        this.drawNDVIScale();
    }

    displaySoilMoistureData() {
        const farmData = this.gameEngine.getFarmData();
        const scaleX = this.canvas.width / 800;
        const scaleY = this.canvas.height / 600;

        // Draw title
        this.ctx.fillStyle = '#000';
        this.ctx.font = 'bold 16px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('SMAP - Soil Moisture', this.canvas.width / 2, 20);

        // Draw zones with moisture coloring
        farmData.zones.forEach(zone => {
            const x = zone.x * scaleX;
            const y = zone.y * scaleY + 30;
            const width = zone.width * scaleX;
            const height = zone.height * scaleY;

            // Color based on soil moisture
            this.ctx.fillStyle = this.getSoilMoistureColor(zone.soilMoisture);
            this.ctx.fillRect(x, y, width, height);

            this.ctx.strokeStyle = '#333';
            this.ctx.lineWidth = 0.5;
            this.ctx.strokeRect(x, y, width, height);
        });

        this.drawSoilMoistureScale();
    }

    displayPrecipitationData() {
        // Draw title
        this.ctx.fillStyle = '#000';
        this.ctx.font = 'bold 16px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('GPM - Global Precipitation Measurement', this.canvas.width / 2, 20);

        // Draw mock precipitation forecast
        this.drawPrecipitationChart();
    }

    getNDVIColor(ndvi) {
        // Create color gradient from brown to green based on NDVI
        if (ndvi < 0.2) return '#8D6E63'; // Brown - bare soil
        if (ndvi < 0.3) return '#D7CCC8'; // Light brown
        if (ndvi < 0.4) return '#FFC107'; // Yellow - stressed
        if (ndvi < 0.5) return '#CDDC39'; // Yellow-green
        if (ndvi < 0.6) return '#8BC34A'; // Light green
        if (ndvi < 0.7) return '#4CAF50'; // Green
        return '#2E7D32'; // Dark green - very healthy
    }

    getSoilMoistureColor(moisture) {
        // Create color gradient from red to blue based on moisture
        if (moisture < 0.2) return '#D32F2F'; // Red - very dry
        if (moisture < 0.3) return '#FF5722'; // Orange-red - dry
        if (moisture < 0.4) return '#FF9800'; // Orange - moderate
        if (moisture < 0.5) return '#FFC107'; // Yellow - adequate
        if (moisture < 0.6) return '#8BC34A'; // Light green - good
        if (moisture < 0.8) return '#4CAF50'; // Green - very good
        return '#2196F3'; // Blue - saturated
    }

    drawNDVIScale() {
        const scaleX = 20;
        const scaleY = this.canvas.height - 80;
        const scaleWidth = 200;
        const scaleHeight = 20;

        // Draw scale background
        this.ctx.fillStyle = '#f0f0f0';
        this.ctx.fillRect(scaleX, scaleY, scaleWidth, scaleHeight);

        // Draw color gradient
        for (let i = 0; i < scaleWidth; i++) {
            const ndvi = i / scaleWidth;
            this.ctx.fillStyle = this.getNDVIColor(ndvi);
            this.ctx.fillRect(scaleX + i, scaleY, 1, scaleHeight);
        }

        // Draw scale labels
        this.ctx.fillStyle = '#000';
        this.ctx.font = '12px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText('0.0', scaleX, scaleY + scaleHeight + 15);
        this.ctx.textAlign = 'center';
        this.ctx.fillText('0.5', scaleX + scaleWidth/2, scaleY + scaleHeight + 15);
        this.ctx.textAlign = 'right';
        this.ctx.fillText('1.0', scaleX + scaleWidth, scaleY + scaleHeight + 15);

        // Scale title
        this.ctx.textAlign = 'center';
        this.ctx.fillText('NDVI Value', scaleX + scaleWidth/2, scaleY - 5);
    }

    drawSoilMoistureScale() {
        const scaleX = 20;
        const scaleY = this.canvas.height - 80;
        const scaleWidth = 200;
        const scaleHeight = 20;

        this.ctx.fillStyle = '#f0f0f0';
        this.ctx.fillRect(scaleX, scaleY, scaleWidth, scaleHeight);

        for (let i = 0; i < scaleWidth; i++) {
            const moisture = i / scaleWidth;
            this.ctx.fillStyle = this.getSoilMoistureColor(moisture);
            this.ctx.fillRect(scaleX + i, scaleY, 1, scaleHeight);
        }

        this.ctx.fillStyle = '#000';
        this.ctx.font = '12px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText('Dry', scaleX, scaleY + scaleHeight + 15);
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Optimal', scaleX + scaleWidth/2, scaleY + scaleHeight + 15);
        this.ctx.textAlign = 'right';
        this.ctx.fillText('Saturated', scaleX + scaleWidth, scaleY + scaleHeight + 15);

        this.ctx.textAlign = 'center';
        this.ctx.fillText('Soil Moisture Level', scaleX + scaleWidth/2, scaleY - 5);
    }

    drawPrecipitationChart() {
        const chartX = 50;
        const chartY = 50;
        const chartWidth = this.canvas.width - 100;
        const chartHeight = this.canvas.height - 150;

        // Draw chart background
        this.ctx.fillStyle = '#f8f9fa';
        this.ctx.fillRect(chartX, chartY, chartWidth, chartHeight);
        this.ctx.strokeStyle = '#333';
        this.ctx.strokeRect(chartX, chartY, chartWidth, chartHeight);

        // Draw precipitation bars for next 7 days
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const precipitation = [0.2, 0.0, 0.1, 0.8, 1.2, 0.3, 0.0]; // inches
        const maxPrecip = Math.max(...precipitation);

        const barWidth = chartWidth / days.length;

        days.forEach((day, index) => {
            const barHeight = (precipitation[index] / Math.max(maxPrecip, 1)) * (chartHeight - 40);
            const x = chartX + (index * barWidth) + 10;
            const y = chartY + chartHeight - barHeight - 20;

            // Draw bar
            this.ctx.fillStyle = precipitation[index] > 0.5 ? '#2196F3' : '#81C784';
            this.ctx.fillRect(x, y, barWidth - 20, barHeight);

            // Draw day label
            this.ctx.fillStyle = '#000';
            this.ctx.font = '12px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(day, x + (barWidth - 20) / 2, chartY + chartHeight - 5);

            // Draw precipitation value
            this.ctx.fillText(`${precipitation[index]}"`, x + (barWidth - 20) / 2, y - 5);
        });

        // Chart title
        this.ctx.font = 'bold 14px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('7-Day Precipitation Forecast', chartX + chartWidth/2, chartY - 10);
    }

    drawDataInfo() {
        const infoY = this.canvas.height - 25;

        this.ctx.fillStyle = '#666';
        this.ctx.font = '10px Arial';
        this.ctx.textAlign = 'left';

        let infoText = '';
        switch (this.activeTab) {
            case 'ndvi':
                infoText = 'NDVI measures vegetation health. Higher values (greener colors) indicate healthier crops.';
                break;
            case 'moisture':
                infoText = 'Soil moisture data helps optimize irrigation. Red areas need water, blue areas are well-watered.';
                break;
            case 'precipitation':
                infoText = 'Precipitation forecast helps plan irrigation timing. Plan ahead for dry periods.';
                break;
        }

        this.ctx.fillText(infoText, 10, infoY);
    }

    generateMockSatelliteData() {
        return {
            lastUpdated: new Date(),
            source: 'NASA MODIS/SMAP/GPM',
            coverage: 'Arizona, USA',
            resolution: '250m'
        };
    }

    updateMockData() {
        // Simulate data updates each week
        this.mockSatelliteData.lastUpdated = new Date();

        // Update some zones to show data changes over time
        const farmData = this.gameEngine.getFarmData();
        farmData.zones.forEach(zone => {
            // Add some natural variation
            zone.ndvi += (Math.random() - 0.5) * 0.05;
            zone.ndvi = Math.max(0.1, Math.min(1.0, zone.ndvi));

            zone.soilMoisture += (Math.random() - 0.5) * 0.1;
            zone.soilMoisture = Math.max(0.1, Math.min(1.0, zone.soilMoisture));
        });

        this.updateDisplay();
    }

    // Public methods for external access
    getCurrentData() {
        return {
            tab: this.activeTab,
            farmData: this.gameEngine.getFarmData(),
            metadata: this.mockSatelliteData
        };
    }

    highlightZone(zoneId) {
        // Highlight specific zone in the current display
        const farmData = this.gameEngine.getFarmData();
        const zone = farmData.zones.find(z => z.id === zoneId);

        if (zone) {
            const scaleX = this.canvas.width / 800;
            const scaleY = this.canvas.height / 600;
            const x = zone.x * scaleX;
            const y = zone.y * scaleY + 30;
            const width = zone.width * scaleX;
            const height = zone.height * scaleY;

            this.ctx.strokeStyle = '#FF4081';
            this.ctx.lineWidth = 3;
            this.ctx.strokeRect(x, y, width, height);
        }
    }
}