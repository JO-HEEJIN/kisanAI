/**
 * Pixel Hunt Challenge Game
 * Educational game for finding specific agricultural patterns in satellite imagery
 */

class PixelHuntChallenge {
    constructor(container) {
        this.container = container;
        this.score = 0;
        this.level = 1;
        this.currentChallenge = null;
        this.selectedPixels = [];
        this.pixelGrid = null;
        this.timer = null;
        this.timeLimit = 60; // seconds
        this.proxyUrl = 'http://localhost:3001'; // NASA proxy server
        this.currentDataLayer = 'moisture'; // Current visualization layer - better for showing regional differences
        this.currentResolution = 30; // Current pixel resolution in meters
        this.currentLat = 33.4484; // Default Arizona coordinates
        this.currentLon = -112.0740; // Default Arizona coordinates

        this.challenges = [
            // Level 1: Basic
            {
                level: 1,
                title: "Find Healthy Crops",
                description: "Locate pixels with NDVI > 0.7 indicating healthy vegetation",
                target: "healthy_crops",
                condition: (pixel) => pixel.ndvi > 0.7,
                points: 10,
                hint: "Look for bright green areas with high NDVI values"
            },
            // Level 2: Intermediate
            {
                level: 2,
                title: "Detect Drought Stress",
                description: "Find crops with low soil moisture (< 20%) that need irrigation",
                target: "drought_stress",
                condition: (pixel) => pixel.moisture < 0.2 && pixel.ndvi > 0.3,
                points: 20,
                hint: "Look for vegetation with very low soil moisture"
            },
            // Level 3: Advanced
            {
                level: 3,
                title: "Identify Irrigated Fields",
                description: "Find agricultural areas with irrigation systems",
                target: "irrigation",
                condition: (pixel) => pixel.irrigation === true && pixel.cropType !== 'bare_soil',
                points: 30,
                hint: "Look for regular patterns and higher moisture in crop areas"
            },
            // Level 4: Expert
            {
                level: 4,
                title: "Spot Crop Disease",
                description: "Identify crops showing signs of disease (low health, moderate NDVI)",
                target: "disease",
                condition: (pixel) => pixel.health < 0.4 && pixel.ndvi > 0.2 && pixel.ndvi < 0.5,
                points: 40,
                hint: "Look for patches with unusual NDVI patterns within crop fields"
            },
            // Level 5: Master
            {
                level: 5,
                title: "Multi-Spectral Analysis",
                description: "Find wheat fields ready for harvest (specific NDVI range)",
                target: "harvest_ready",
                condition: (pixel) => pixel.cropType === 'wheat' && pixel.ndvi > 0.4 && pixel.ndvi < 0.6,
                points: 50,
                hint: "Wheat ready for harvest has moderate NDVI values"
            }
        ];

        this.init();
    }

    init() {
        this.render();
        this.showStartScreen();
    }

    render() {
        this.container.innerHTML = `
            <div class="pixel-hunt-container">
                <div class="game-header">
                    <h2>Pixel Hunt Challenge</h2>
                    <div class="game-stats">
                        <div class="stat">
                            <span class="stat-label">Score:</span>
                            <span class="stat-value" id="gameScore">0</span>
                        </div>
                        <div class="stat">
                            <span class="stat-label">Level:</span>
                            <span class="stat-value" id="gameLevel">1</span>
                        </div>
                        <div class="stat">
                            <span class="stat-label">Time:</span>
                            <span class="stat-value" id="gameTimer">60s</span>
                        </div>
                    </div>
                </div>

                <div class="challenge-info" id="challengeInfo">
                    <!-- Challenge details will be loaded here -->
                </div>

                <div class="location-panel">
                    <h4>📍 Location Settings</h4>
                    <div class="location-controls">
                        <div class="current-location">
                            <span>Current: </span>
                            <span id="currentCoords">${this.currentLat.toFixed(4)}, ${this.currentLon.toFixed(4)}</span>
                        </div>
                        <div class="location-buttons">
                            <button onclick="pixelHunt.loadFromSatelliteTab()" class="location-btn">
                                📡 Load from Satellite Data Tab
                            </button>
                            <button onclick="pixelHunt.resetToDefault()" class="location-btn secondary">
                                🏜️ Reset to Arizona Default
                            </button>
                        </div>
                        <div class="location-status" id="locationStatus" style="display: none;">
                            <!-- Status messages -->
                        </div>
                    </div>
                </div>

                <div class="game-area">
                    <div class="pixel-grid-container">
                        <canvas id="pixelCanvas" width="600" height="600"></canvas>
                        <div class="pixel-info" id="pixelInfo" style="display: none;">
                            <!-- Pixel data on hover -->
                        </div>
                    </div>

                    <div class="game-controls">
                        <div class="resolution-selector">
                            <h4>📏 Resolution</h4>
                            <button onclick="pixelHunt.changeResolution(10)" class="res-btn">Sentinel 10m</button>
                            <button onclick="pixelHunt.changeResolution(30)" class="res-btn active">Landsat 30m</button>
                            <button onclick="pixelHunt.changeResolution(250)" class="res-btn">MODIS 250m</button>
                        </div>

                        <div class="data-layers">
                            <h4>📊 Data Layers</h4>
                            <label><input type="radio" name="dataLayer" value="ndvi" onchange="pixelHunt.changeDataLayer('ndvi')"><span>NDVI</span></label>
                            <label><input type="radio" name="dataLayer" value="moisture" checked onchange="pixelHunt.changeDataLayer('moisture')"><span>Soil Moisture</span></label>
                            <label><input type="radio" name="dataLayer" value="temperature" onchange="pixelHunt.changeDataLayer('temperature')"><span>Temperature</span></label>
                        </div>

                        <div class="selected-pixels">
                            <h4>📍 Selected Pixels</h4>
                            <div id="selectedList"></div>
                            <button onclick="pixelHunt.submitAnswer()" class="submit-btn">Submit Answer</button>
                        </div>
                    </div>
                </div>

                <div class="game-legend">
                    <h4>🎨 Color Legend</h4>
                    <div class="legend-items" id="legendItems">
                        <!-- Legend will be updated based on selected data layer -->
                    </div>
                </div>

                <div class="modal" id="resultModal" style="display: none;">
                    <div class="modal-content">
                        <h3 id="resultTitle"></h3>
                        <div id="resultMessage"></div>
                        <button onclick="pixelHunt.nextLevel()" class="next-btn">Next Level</button>
                    </div>
                </div>
            </div>
        `;

        this.setupCanvas();
        this.bindEvents();
        this.updateLegend();
    }

    async loadChallenge(level) {
        this.level = level;
        this.currentChallenge = this.challenges[level - 1];
        this.selectedPixels = [];
        this.timeLimit = 60 + (level - 1) * 10; // More time for harder levels

        // Get location characteristics for display
        const locationChars = this.getLocationCharacteristics(this.currentLat, this.currentLon);

        // Update UI
        document.getElementById('gameLevel').textContent = level;
        document.getElementById('challengeInfo').innerHTML = `
            <h3>${this.currentChallenge.title}</h3>
            <p>${this.currentChallenge.description}</p>
            <div class="hint">💡 Hint: ${this.currentChallenge.hint}</div>
            <div class="target-count">Find at least 5 matching pixels</div>
            <div class="resolution-info">📡 Current Resolution: ${this.currentResolution}m (${this.getResolutionDescription(this.currentResolution)})</div>
            <div class="location-info">📍 Location: ${locationChars.region} (${this.currentLat.toFixed(4)}, ${this.currentLon.toFixed(4)})<br>
            🌍 Climate: ${locationChars.climate} | 🌾 Agriculture: ${this.getAgricultureDescription(locationChars.agriculture)}</div>
        `;

        // Load pixel data
        await this.loadPixelData();

        // Start timer
        this.startTimer();
    }

    async loadPixelData() {
        try {
            console.log(`🔄 Loading pixel data for coordinates: ${this.currentLat}, ${this.currentLon} with resolution: ${this.currentResolution}m`);

            // Show loading indicator
            const canvas = document.getElementById('pixelCanvas');
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#1a1f3a';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#00ff88';
            ctx.font = '20px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('Loading NASA data...', canvas.width/2, canvas.height/2 - 20);
            ctx.font = '14px Arial';
            ctx.fillText(`${this.currentLat.toFixed(4)}, ${this.currentLon.toFixed(4)}`, canvas.width/2, canvas.height/2 + 10);

            // Show loading status
            this.showLocationStatus(`🔄 Loading data for ${this.currentLat.toFixed(4)}, ${this.currentLon.toFixed(4)}...`, 'loading');

            // Fetch real pixel data from proxy server with current resolution
            const url = `${this.proxyUrl}/api/pixel-hunt/data?lat=${this.currentLat}&lon=${this.currentLon}&resolution=${this.currentResolution}`;
            console.log(`📡 Fetching from: ${url}`);

            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            console.log('📊 API Response:', data);

            if (data.pixels && data.pixels.length > 0) {
                this.pixelGrid = data.pixels;
                console.log(`✅ Loaded ${this.pixelGrid.length} pixels with ${this.currentResolution}m resolution`);
                this.showLocationStatus(`✅ Loaded ${this.pixelGrid.length} pixels successfully`, 'success');
                this.drawPixelGrid();
            } else {
                throw new Error('No pixel data received from server');
            }

        } catch (error) {
            console.error('❌ Failed to load pixel data:', error);
            this.showLocationStatus(`❌ API failed, using simulated data for ${this.currentLat.toFixed(4)}, ${this.currentLon.toFixed(4)}`, 'error');

            // Use enhanced fallback data with location-appropriate characteristics
            this.generateEnhancedMockData();
            this.drawPixelGrid();
        }
    }

    generateMockPixelData() {
        this.pixelGrid = [];
        // Different grid sizes based on resolution
        const gridSize = this.getGridSizeForResolution(this.currentResolution);

        for (let row = 0; row < gridSize; row++) {
            for (let col = 0; col < gridSize; col++) {
                this.pixelGrid.push({
                    id: `${col}_${row}`,
                    x: col,
                    y: row,
                    ndvi: Math.random(),
                    moisture: Math.random(),
                    temperature: 20 + Math.random() * 20,
                    cropType: Math.random() > 0.7 ? 'corn' : Math.random() > 0.5 ? 'wheat' : 'bare_soil',
                    health: Math.random(),
                    irrigation: Math.random() > 0.6
                });
            }
        }

        console.log(`Generated ${this.pixelGrid.length} pixels in ${gridSize}x${gridSize} grid for ${this.currentResolution}m resolution`);
    }

    generateEnhancedMockData() {
        this.pixelGrid = [];
        const gridSize = this.getGridSizeForResolution(this.currentResolution);

        // Determine location characteristics
        const locationChars = this.getLocationCharacteristics(this.currentLat, this.currentLon);
        console.log(`🌍 Generating enhanced data for ${locationChars.region}: ${locationChars.climate}`);

        for (let row = 0; row < gridSize; row++) {
            for (let col = 0; col < gridSize; col++) {
                // Create realistic patterns based on location
                const pixel = this.generateLocationSpecificPixel(col, row, gridSize, locationChars);
                this.pixelGrid.push(pixel);
            }
        }

        console.log(`Generated ${this.pixelGrid.length} location-appropriate pixels for ${locationChars.region}`);
    }

    getLocationCharacteristics(lat, lon) {
        // São Paulo, Brazil characteristics
        if (lat < -15 && lat > -30 && lon < -40 && lon > -55) {
            return {
                region: 'São Paulo Region, Brazil',
                climate: 'Subtropical Urban/Agricultural',
                vegetation: 'mixed_urban_agriculture',
                moisture: 'moderate_to_high',
                agriculture: 'sugarcane_coffee_urban'
            };
        }
        // Arizona, USA (default)
        else if (lat > 30 && lat < 40 && lon < -110 && lon > -115) {
            return {
                region: 'Arizona, USA',
                climate: 'Arid Desert',
                vegetation: 'sparse_irrigated',
                moisture: 'low',
                agriculture: 'irrigated_crops'
            };
        }
        // Korea
        else if (lat > 35 && lat < 40 && lon > 125 && lon < 130) {
            return {
                region: 'Korea',
                climate: 'Temperate Agricultural',
                vegetation: 'intensive_agriculture',
                moisture: 'high',
                agriculture: 'rice_vegetables'
            };
        }
        // Default fallback
        else {
            return {
                region: 'Unknown Region',
                climate: 'Temperate',
                vegetation: 'mixed',
                moisture: 'moderate',
                agriculture: 'mixed_crops'
            };
        }
    }

    generateLocationSpecificPixel(col, row, gridSize, locationChars) {
        const pixel = {
            id: `${col}_${row}`,
            x: col,
            y: row
        };

        // Generate values based on location characteristics
        switch (locationChars.agriculture) {
            case 'sugarcane_coffee_urban':
                // São Paulo area - subtropical climate with high moisture
                const distanceFromCenter = Math.sqrt((col - gridSize/2)**2 + (row - gridSize/2)**2);
                const isUrban = distanceFromCenter < gridSize * 0.2;
                const isSugarcane = (col + row) % 3 === 0 && !isUrban;
                const isCoffee = (col + row) % 4 === 1 && !isUrban;

                if (isUrban) {
                    pixel.ndvi = 0.35 + Math.random() * 0.25; // Urban green spaces in São Paulo
                    pixel.moisture = 0.6 + Math.random() * 0.3; // Urban areas still retain moisture in São Paulo
                    pixel.cropType = 'urban';
                } else if (isSugarcane) {
                    pixel.ndvi = 0.8 + Math.random() * 0.18; // Very high biomass for healthy sugarcane
                    pixel.moisture = 0.7 + Math.random() * 0.25; // Very high moisture for sugarcane
                    pixel.cropType = 'sugarcane';
                } else if (isCoffee) {
                    pixel.ndvi = 0.85 + Math.random() * 0.13; // Exceptionally healthy coffee plants in São Paulo's ideal climate
                    pixel.moisture = 0.8 + Math.random() * 0.15; // Coffee needs high moisture
                    pixel.cropType = 'coffee';
                } else {
                    // Pasture and natural areas in São Paulo region
                    pixel.ndvi = 0.6 + Math.random() * 0.35; // Very good vegetation coverage in subtropical climate
                    pixel.moisture = 0.65 + Math.random() * 0.3; // São Paulo gets abundant rainfall
                    pixel.cropType = 'pasture';
                }
                break;

            case 'irrigated_crops':
                // Arizona - sparse with irrigation patterns
                const isIrrigated = (col % 4 === 0 || row % 4 === 0) && Math.random() > 0.3;
                if (isIrrigated) {
                    pixel.ndvi = 0.5 + Math.random() * 0.4;
                    pixel.moisture = 0.4 + Math.random() * 0.4;
                    pixel.cropType = Math.random() > 0.5 ? 'corn' : 'cotton';
                } else {
                    pixel.ndvi = 0.05 + Math.random() * 0.2; // Desert
                    pixel.moisture = 0.05 + Math.random() * 0.15;
                    pixel.cropType = 'bare_soil';
                }
                break;

            default:
                // Default mixed agriculture
                pixel.ndvi = Math.random();
                pixel.moisture = Math.random();
                pixel.cropType = Math.random() > 0.7 ? 'corn' : Math.random() > 0.5 ? 'wheat' : 'bare_soil';
        }

        // Common properties
        pixel.temperature = 20 + Math.random() * 20;
        pixel.health = Math.min(pixel.ndvi + 0.1, 1.0);
        pixel.irrigation = pixel.moisture > 0.6;

        return pixel;
    }

    getGridSizeForResolution(resolution) {
        // Higher resolution = more pixels in the same area (but keep reasonable for API calls)
        switch (resolution) {
            case 10: // Sentinel-2: 10m resolution
                return 15; // 15x15 grid (225 pixels) - high detail
            case 30: // Landsat: 30m resolution
                return 12; // 12x12 grid (144 pixels) - medium detail
            case 250: // MODIS: 250m resolution
                return 8; // 8x8 grid (64 pixels) - landscape view
            default:
                return 12;
        }
    }

    getResolutionDescription(resolution) {
        switch (resolution) {
            case 10:
                return 'High detail - Individual crop rows visible';
            case 30:
                return 'Medium detail - Field patterns clear';
            case 250:
                return 'Landscape view - Regional patterns';
            default:
                return 'Standard resolution';
        }
    }

    setupCanvas() {
        this.canvas = document.getElementById('pixelCanvas');
        this.ctx = this.canvas.getContext('2d');
    }

    drawPixelGrid() {
        if (!this.ctx || !this.pixelGrid) return;

        const gridSize = Math.sqrt(this.pixelGrid.length);
        const pixelSize = this.canvas.width / gridSize;

        console.log(`Drawing grid: ${gridSize}x${gridSize} pixels, pixel size: ${pixelSize}px, layer: ${this.currentDataLayer}`);

        this.pixelGrid.forEach((pixel, index) => {
            const col = index % gridSize;
            const row = Math.floor(index / gridSize);
            const x = col * pixelSize;
            const y = row * pixelSize;

            // Ensure pixel has an ID that matches our coordinate system
            if (!pixel.id) {
                pixel.id = `${col}_${row}`;
            }

            // Color based on selected data layer
            let color = this.getPixelColor(pixel);

            this.ctx.fillStyle = color;
            this.ctx.fillRect(x, y, pixelSize - 1, pixelSize - 1);

            // Mark selected pixels with a bright white border
            if (this.selectedPixels.includes(pixel.id)) {
                this.ctx.strokeStyle = '#ffffff';
                this.ctx.lineWidth = 3;
                this.ctx.strokeRect(x + 1, y + 1, pixelSize - 3, pixelSize - 3);

                // Add a cross in the center for better visibility
                this.ctx.beginPath();
                this.ctx.moveTo(x + pixelSize/4, y + pixelSize/2);
                this.ctx.lineTo(x + 3*pixelSize/4, y + pixelSize/2);
                this.ctx.moveTo(x + pixelSize/2, y + pixelSize/4);
                this.ctx.lineTo(x + pixelSize/2, y + 3*pixelSize/4);
                this.ctx.stroke();
            }
        });
    }

    getPixelColor(pixel) {
        switch (this.currentDataLayer) {
            case 'ndvi':
                // NDVI color scale: red (low) -> yellow (medium) -> green (high)
                if (pixel.ndvi > 0.7) {
                    return `rgb(0, ${Math.floor(255 * pixel.ndvi)}, 0)`;
                } else if (pixel.ndvi > 0.4) {
                    return `rgb(${Math.floor(255 * (1 - pixel.ndvi))}, ${Math.floor(255 * pixel.ndvi)}, 0)`;
                } else if (pixel.ndvi > 0.1) {
                    return `rgb(${Math.floor(255 * (1 - pixel.ndvi))}, 0, 0)`;
                } else {
                    return 'rgb(0, 0, 100)'; // Water/no vegetation
                }

            case 'moisture':
                // Enhanced soil moisture color scale for better São Paulo visualization
                const moistureValue = pixel.moisture || 0;

                if (moistureValue > 0.8) {
                    // Very high moisture: Deep blue
                    return `rgb(0, 50, 255)`;
                } else if (moistureValue > 0.6) {
                    // High moisture: Bright blue
                    const blueIntensity = Math.floor(150 + 105 * (moistureValue - 0.6) / 0.2);
                    return `rgb(0, 100, ${blueIntensity})`;
                } else if (moistureValue > 0.4) {
                    // Medium-high moisture: Light blue
                    const greenComponent = Math.floor(150 + 100 * (moistureValue - 0.4) / 0.2);
                    return `rgb(50, ${greenComponent}, 255)`;
                } else if (moistureValue > 0.2) {
                    // Medium moisture: Blue-green
                    const redComponent = Math.floor(100 * (0.4 - moistureValue) / 0.2);
                    const greenComponent = Math.floor(150 + 100 * (moistureValue - 0.2) / 0.2);
                    return `rgb(${redComponent}, ${greenComponent}, 200)`;
                } else {
                    // Low moisture: Brown/red
                    const redComponent = Math.floor(139 + 100 * (0.2 - moistureValue) / 0.2);
                    const greenComponent = Math.floor(69 * moistureValue / 0.2);
                    return `rgb(${redComponent}, ${greenComponent}, 19)`;
                }

            case 'temperature':
                // Temperature color scale: blue (cold) -> red (hot)
                const temp = pixel.temperature || 20;
                const normalizedTemp = Math.max(0, Math.min(1, (temp - 10) / 30)); // 10-40°C range
                if (normalizedTemp > 0.6) {
                    return `rgb(255, ${Math.floor(255 * (1 - normalizedTemp))}, 0)`;
                } else if (normalizedTemp > 0.3) {
                    return `rgb(${Math.floor(255 * normalizedTemp)}, 255, ${Math.floor(255 * (1 - normalizedTemp))})`;
                } else {
                    return `rgb(0, ${Math.floor(255 * normalizedTemp)}, 255)`;
                }

            default:
                return 'rgb(128, 128, 128)'; // Gray fallback
        }
    }

    bindEvents() {
        const canvas = document.getElementById('pixelCanvas');
        const pixelInfo = document.getElementById('pixelInfo');

        // Click to select pixel
        canvas.addEventListener('click', (e) => {
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            this.selectPixel(x, y);
        });

        // Hover to show pixel info
        canvas.addEventListener('mousemove', (e) => {
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            this.showPixelInfo(x, y, e.clientX, e.clientY);
        });

        canvas.addEventListener('mouseleave', () => {
            pixelInfo.style.display = 'none';
        });
    }

    selectPixel(x, y) {
        const gridSize = Math.sqrt(this.pixelGrid.length);
        const pixelSize = this.canvas.width / gridSize;

        // More precise coordinate calculation
        const col = Math.floor(x / pixelSize);
        const row = Math.floor(y / pixelSize);

        // Ensure we're within bounds
        if (col < 0 || row < 0 || col >= gridSize || row >= gridSize) {
            console.log(`Click out of bounds: col=${col}, row=${row}, gridSize=${gridSize}`);
            return;
        }

        const pixelIndex = col + row * gridSize;
        const pixel = this.pixelGrid[pixelIndex];

        console.log(`Clicked at canvas (${x.toFixed(1)}, ${y.toFixed(1)}) -> grid [${col}, ${row}] -> index ${pixelIndex}`);

        if (pixel) {
            const pixelId = pixel.id || `${col}_${row}`;

            if (this.selectedPixels.includes(pixelId)) {
                // Deselect
                this.selectedPixels = this.selectedPixels.filter(id => id !== pixelId);
                console.log(`Deselected pixel: ${pixelId}`);
            } else {
                // Select
                this.selectedPixels.push(pixelId);
                console.log(`Selected pixel: ${pixelId}`);
            }

            this.drawPixelGrid();
            this.updateSelectedList();
        } else {
            console.log(`No pixel found at index ${pixelIndex}`);
        }
    }

    showPixelInfo(x, y, clientX, clientY) {
        const gridSize = Math.sqrt(this.pixelGrid.length);
        const pixelSize = this.canvas.width / gridSize;
        const col = Math.floor(x / pixelSize);
        const row = Math.floor(y / pixelSize);

        // Ensure we're within bounds
        if (col < 0 || row < 0 || col >= gridSize || row >= gridSize) {
            return;
        }

        const pixelIndex = col + row * gridSize;
        const pixel = this.pixelGrid[pixelIndex];

        if (pixel) {
            const pixelInfo = document.getElementById('pixelInfo');

            // Highlight current data layer value
            let mainValue = '';
            switch (this.currentDataLayer) {
                case 'ndvi':
                    mainValue = `<strong>NDVI: ${pixel.ndvi.toFixed(3)}</strong>`;
                    break;
                case 'moisture':
                    mainValue = `<strong>Moisture: ${(pixel.moisture * 100).toFixed(1)}%</strong>`;
                    break;
                case 'temperature':
                    mainValue = `<strong>Temperature: ${pixel.temperature.toFixed(1)}°C</strong>`;
                    break;
            }

            pixelInfo.innerHTML = `
                <strong>Pixel [${col}, ${row}]</strong><br>
                ${mainValue}<br>
                <hr style="margin: 5px 0; border: 1px solid #00ff88;">
                NDVI: ${pixel.ndvi.toFixed(3)}<br>
                Moisture: ${(pixel.moisture * 100).toFixed(1)}%<br>
                Temp: ${pixel.temperature.toFixed(1)}°C<br>
                Type: ${pixel.cropType}<br>
                Health: ${(pixel.health * 100).toFixed(0)}%<br>
                <small>Index: ${pixelIndex}</small>
            `;
            pixelInfo.style.display = 'block';
            pixelInfo.style.left = `${clientX + 10}px`;
            pixelInfo.style.top = `${clientY - 140}px`;
        }
    }

    updateSelectedList() {
        const list = document.getElementById('selectedList');
        list.innerHTML = `Selected: ${this.selectedPixels.length} pixels`;
    }

    startTimer() {
        let timeLeft = this.timeLimit;

        this.timer = setInterval(() => {
            timeLeft--;
            document.getElementById('gameTimer').textContent = `${timeLeft}s`;

            if (timeLeft <= 0) {
                clearInterval(this.timer);
                this.submitAnswer();
            }
        }, 1000);
    }

    submitAnswer() {
        clearInterval(this.timer);

        // Check selected pixels against challenge condition
        let correctPixels = 0;
        let wrongPixels = 0;

        this.selectedPixels.forEach(pixelId => {
            const [x, y] = pixelId.split('_').map(Number);
            const pixelIndex = x + y * Math.sqrt(this.pixelGrid.length);
            const pixel = this.pixelGrid[pixelIndex];

            if (pixel && this.currentChallenge.condition(pixel)) {
                correctPixels++;
            } else {
                wrongPixels++;
            }
        });

        // Calculate score
        const accuracy = correctPixels / (correctPixels + wrongPixels) || 0;
        const points = Math.round(this.currentChallenge.points * accuracy * (correctPixels / 5));
        this.score += points;

        // Show result
        this.showResult(correctPixels, wrongPixels, points);
    }

    showResult(correct, wrong, points) {
        const modal = document.getElementById('resultModal');
        const title = document.getElementById('resultTitle');
        const message = document.getElementById('resultMessage');

        const accuracy = (correct / (correct + wrong) * 100) || 0;
        const passed = correct >= 5 && accuracy >= 60;

        title.textContent = passed ? '🎉 Challenge Complete!' : '😕 Try Again';
        message.innerHTML = `
            <p>Correct Pixels: ${correct}</p>
            <p>Wrong Pixels: ${wrong}</p>
            <p>Accuracy: ${accuracy.toFixed(1)}%</p>
            <p>Points Earned: ${points}</p>
            <p>${passed ? 'Great job! You found the target pixels!' : 'You need at least 5 correct pixels with 60% accuracy.'}</p>
        `;

        modal.style.display = 'block';
        document.getElementById('gameScore').textContent = this.score;
    }

    nextLevel() {
        document.getElementById('resultModal').style.display = 'none';

        if (this.level < this.challenges.length) {
            this.loadChallenge(this.level + 1);
        } else {
            alert(`🏆 Congratulations! You completed all levels with a score of ${this.score}!`);
            this.loadChallenge(1); // Restart
        }
    }

    changeResolution(resolution) {
        console.log(`Changing resolution from ${this.currentResolution}m to ${resolution}m`);

        // Update current resolution
        this.currentResolution = resolution;

        // Update active button
        document.querySelectorAll('.res-btn').forEach(btn => btn.classList.remove('active'));
        event.target.classList.add('active');

        // Clear selected pixels (different grid size means different pixel IDs)
        this.selectedPixels = [];
        this.updateSelectedList();

        // Reload pixel data with new resolution
        this.loadPixelData();
    }

    changeDataLayer(layer) {
        console.log(`Changing data layer to: ${layer}`);
        this.currentDataLayer = layer;
        this.updateLegend();

        // Just redraw with new colors, DO NOT regenerate data!
        this.drawPixelGrid();

        // DO NOT call forceCanvasRefresh here - it regenerates data!
    }

    loadFromSatelliteTab() {
        console.log('🔄 Loading coordinates from Satellite Data Visualization tab');

        // Get coordinates from the Satellite Data Visualization inputs
        const latInput = document.getElementById('latInput');
        const lonInput = document.getElementById('lonInput');

        if (!latInput || !lonInput) {
            this.showLocationStatus('❌ Satellite Data tab not found. Please visit the Satellite Data Visualization tab first.', 'error');
            return;
        }

        const lat = parseFloat(latInput.value);
        const lon = parseFloat(lonInput.value);

        if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
            this.showLocationStatus('❌ Invalid coordinates in Satellite Data tab. Please enter valid coordinates there first.', 'error');
            return;
        }

        // Update current location
        this.currentLat = lat;
        this.currentLon = lon;

        // Update UI
        this.updateLocationDisplay();
        this.showLocationStatus(`✅ Loaded coordinates: ${lat.toFixed(4)}, ${lon.toFixed(4)}`, 'success');

        // Reload pixel data with new location
        this.loadPixelData();

        // Force canvas refresh
        this.forceCanvasRefresh();

        // Update challenge info with new location
        this.updateChallengeLocationInfo();
    }

    resetToDefault() {
        console.log('🏜️ Resetting to Arizona default coordinates');

        // Reset to Arizona default
        this.currentLat = 33.4484;
        this.currentLon = -112.0740;

        // Update UI
        this.updateLocationDisplay();
        this.showLocationStatus('✅ Reset to Arizona farm region', 'success');

        // Reload pixel data with default location
        this.loadPixelData();

        // Force canvas refresh
        this.forceCanvasRefresh();

        // Update challenge info with new location
        this.updateChallengeLocationInfo();
    }

    updateLocationDisplay() {
        const coordsElement = document.getElementById('currentCoords');
        if (coordsElement) {
            coordsElement.textContent = `${this.currentLat.toFixed(4)}, ${this.currentLon.toFixed(4)}`;
        }
    }

    showLocationStatus(message, type) {
        const statusElement = document.getElementById('locationStatus');
        if (statusElement) {
            statusElement.style.display = 'block';
            statusElement.className = `location-status ${type}`;
            statusElement.textContent = message;

            // Hide after 3 seconds
            setTimeout(() => {
                statusElement.style.display = 'none';
            }, 3000);
        }
    }

    updateLegend() {
        const legendItems = document.getElementById('legendItems');

        switch (this.currentDataLayer) {
            case 'ndvi':
                legendItems.innerHTML = `
                    <div class="legend-item">
                        <div class="color-box" style="background: #00ff00;"></div>
                        <span>High NDVI (>0.7)</span>
                    </div>
                    <div class="legend-item">
                        <div class="color-box" style="background: #ffff00;"></div>
                        <span>Medium NDVI (0.4-0.7)</span>
                    </div>
                    <div class="legend-item">
                        <div class="color-box" style="background: #ff0000;"></div>
                        <span>Low NDVI (<0.4)</span>
                    </div>
                    <div class="legend-item">
                        <div class="color-box" style="background: #000064;"></div>
                        <span>Water/No vegetation</span>
                    </div>
                `;
                break;

            case 'moisture':
                legendItems.innerHTML = `
                    <div class="legend-item">
                        <div class="color-box" style="background: #0066ff;"></div>
                        <span>Very High Moisture (>70%)</span>
                    </div>
                    <div class="legend-item">
                        <div class="color-box" style="background: #0099ff;"></div>
                        <span>High Moisture (50-70%)</span>
                    </div>
                    <div class="legend-item">
                        <div class="color-box" style="background: #4da6ff;"></div>
                        <span>Medium Moisture (30-50%)</span>
                    </div>
                    <div class="legend-item">
                        <div class="color-box" style="background: #99ccff;"></div>
                        <span>Moderate Moisture (20-30%)</span>
                    </div>
                    <div class="legend-item">
                        <div class="color-box" style="background: #8b4513;"></div>
                        <span>Low Moisture (<20%)</span>
                    </div>
                `;
                break;

            case 'temperature':
                legendItems.innerHTML = `
                    <div class="legend-item">
                        <div class="color-box" style="background: #ff0000;"></div>
                        <span>Hot (>30°C)</span>
                    </div>
                    <div class="legend-item">
                        <div class="color-box" style="background: #ffff00;"></div>
                        <span>Warm (20-30°C)</span>
                    </div>
                    <div class="legend-item">
                        <div class="color-box" style="background: #00ffff;"></div>
                        <span>Cool (10-20°C)</span>
                    </div>
                    <div class="legend-item">
                        <div class="color-box" style="background: #0000ff;"></div>
                        <span>Cold (<10°C)</span>
                    </div>
                `;
                break;
        }
    }

    forceCanvasRefresh() {
        console.log('🔄 Forcing canvas refresh with current data');

        // Clear canvas first
        if (this.ctx && this.canvas) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }

        // Small delay to ensure clearing is complete
        setTimeout(() => {
            // Regenerate pixel data
            this.generateEnhancedMockData();

            // Force redraw
            this.drawPixelGrid();

            // Update legend
            this.updateLegend();

            console.log(`✅ Canvas refreshed with ${this.pixelGrid.length} pixels for coordinates: ${this.currentLat.toFixed(4)}, ${this.currentLon.toFixed(4)}`);
        }, 50);
    }

    showStartScreen() {
        const challengeInfoElement = document.getElementById('challengeInfo');
        const pixelCanvas = document.getElementById('pixelCanvas');
        const gameControls = document.querySelector('.game-controls');

        // Hide canvas and controls initially
        if (pixelCanvas) pixelCanvas.style.display = 'none';
        if (gameControls) gameControls.style.display = 'none';

        // Get current location info
        const locationChars = this.getLocationCharacteristics(this.currentLat, this.currentLon);

        challengeInfoElement.innerHTML = `
            <div class="start-screen">
                <h2>🎯 Welcome to Pixel Hunt Challenge!</h2>
                <div class="start-description">
                    <p>Test your satellite data interpretation skills in this exciting challenge!</p>
                    <p>You'll learn to identify different agricultural features using NASA satellite imagery at various resolutions.</p>
                </div>

                <div class="challenge-overview">
                    <h3>🎮 How to Play:</h3>
                    <ul>
                        <li>🔍 Analyze satellite data at different resolutions (10m, 30m, 250m)</li>
                        <li>🖱️ Click on pixels that match the challenge criteria</li>
                        <li>📊 Switch between NDVI, Soil Moisture, and Temperature layers</li>
                        <li>✅ Select at least 5 correct pixels to complete each level</li>
                        <li>🏆 Earn points for accuracy and speed</li>
                    </ul>
                </div>

                <div class="current-settings">
                    <h3>📍 Current Location:</h3>
                    <div class="location-info">
                        ${locationChars.region} (${this.currentLat.toFixed(4)}, ${this.currentLon.toFixed(4)})<br>
                        🌍 Climate: ${locationChars.climate}<br>
                        🌾 Agriculture: ${this.getAgricultureDescription(locationChars.agriculture)}
                    </div>
                    <p class="location-hint">💡 You can change the location using the panel on the right after starting!</p>
                </div>

                <div class="challenge-levels">
                    <h3>📈 Challenge Levels:</h3>
                    <ol>
                        <li><strong>Water Stress Detection</strong> - Find dry soil areas</li>
                        <li><strong>Healthy Vegetation</strong> - Identify thriving crops</li>
                        <li><strong>Irrigation Patterns</strong> - Spot irrigated fields</li>
                        <li><strong>Crop Disease</strong> - Detect unhealthy crops</li>
                        <li><strong>Harvest Ready</strong> - Find mature wheat fields</li>
                    </ol>
                </div>

                <button class="start-game-btn" onclick="pixelHunt.startGame()">
                    🚀 Start Challenge
                </button>
            </div>
        `;

        // Hide other UI elements
        document.querySelectorAll('.resolution-selector, .data-layers, .selected-pixels, .game-legend').forEach(el => {
            el.style.display = 'none';
        });
    }

    startGame() {
        // Show canvas and controls
        const pixelCanvas = document.getElementById('pixelCanvas');
        const gameControls = document.querySelector('.game-controls');

        if (pixelCanvas) pixelCanvas.style.display = 'block';
        if (gameControls) gameControls.style.display = 'flex';

        // Show other UI elements
        document.querySelectorAll('.resolution-selector, .data-layers, .selected-pixels, .game-legend').forEach(el => {
            el.style.display = 'block';
        });

        // Start the first challenge
        this.loadChallenge(1);
    }

    getAgricultureDescription(agriculture) {
        switch (agriculture) {
            case 'sugarcane_coffee_urban':
                return 'Sugarcane & Coffee Plantations with Urban Areas';
            case 'irrigated_crops':
                return 'Desert Irrigation Agriculture';
            case 'rice_vegetables':
                return 'Rice Paddies & Vegetable Farms';
            case 'mixed_crops':
                return 'Mixed Agricultural Systems';
            default:
                return 'General Agriculture';
        }
    }

    updateChallengeLocationInfo() {
        // Only update if we're currently in a challenge
        if (!this.currentChallenge) return;

        const locationChars = this.getLocationCharacteristics(this.currentLat, this.currentLon);
        const challengeInfoElement = document.getElementById('challengeInfo');

        if (challengeInfoElement && this.currentChallenge) {
            challengeInfoElement.innerHTML = `
                <h3>${this.currentChallenge.title}</h3>
                <p>${this.currentChallenge.description}</p>
                <div class="hint">💡 Hint: ${this.currentChallenge.hint}</div>
                <div class="target-count">Find at least 5 matching pixels</div>
                <div class="resolution-info">📡 Current Resolution: ${this.currentResolution}m (${this.getResolutionDescription(this.currentResolution)})</div>
                <div class="location-info">📍 Location: ${locationChars.region} (${this.currentLat.toFixed(4)}, ${this.currentLon.toFixed(4)})<br>
                🌍 Climate: ${locationChars.climate} | 🌾 Agriculture: ${this.getAgricultureDescription(locationChars.agriculture)}</div>
            `;

            console.log(`🗺️ Updated challenge info for ${locationChars.region}`);
        }
    }
}

// Export for use
window.PixelHuntChallenge = PixelHuntChallenge;