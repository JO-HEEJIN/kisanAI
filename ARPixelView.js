/**
 * ARPixelView.js
 * * This module transforms the live camera feed into an interactive pixel grid.
 * Each pixel represents real-time NASA satellite data for the user's location.
 */
class ARPixelView {
    constructor(sceneEl) {
        this.scene = sceneEl;
        this.camera = document.getElementById('ar-camera');
        this.gridEntity = null;
        this.dataPopup = null;
        this.dataGrid = [];
        this.GRID_ROWS = 10;
        this.GRID_COLS = 8;
        this.PIXEL_SIZE = 0.25;
        this.updateInterval = null;

        console.log("✅ ARPixelView initialized.");
    }

    /**
     * Starts the AR Pixel View experience.
     */
    async start() {
        console.log("🚀 Starting AR Pixel View...");
        this.createPixelGrid();
        this._attachEventListeners();

        // Start fetching and updating data periodically.
        this.updateInterval = setInterval(() => this.updateData(), 15000); // Update every 15 seconds
        await this.updateData(); // Initial data load
        
        // Show initial instruction
        this.showDataPopup({ instruction: "Point at the ground and tap a pixel to analyze soil data." }, { x: 0, y: 0.8, z: -2 });
    }

    /**
     * Stops the AR Pixel View and cleans up the scene.
     */
    stop() {
        console.log("🛑 Stopping AR Pixel View...");
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
        if (this.gridEntity) {
            this.gridEntity.parentNode.removeChild(this.gridEntity);
        }
        if (this.dataPopup) {
            this.dataPopup.parentNode.removeChild(this.dataPopup);
        }
        this.gridEntity = null;
        this.dataPopup = null;
    }

    /**
     * Creates a grid of A-Frame planes to represent the pixels.
     */
    createPixelGrid() {
        this.gridEntity = document.createElement('a-entity');
        this.gridEntity.setAttribute('id', 'pixel-grid-container');
        this.gridEntity.setAttribute('position', '0 0 -2.5'); // Position the grid in front of the camera
        this.gridEntity.setAttribute('look-at', '#ar-camera');

        const totalWidth = this.GRID_COLS * this.PIXEL_SIZE;
        const totalHeight = this.GRID_ROWS * this.PIXEL_SIZE;
        const startX = -totalWidth / 2 + this.PIXEL_SIZE / 2;
        const startY = -totalHeight / 2 + this.PIXEL_SIZE / 2;

        for (let row = 0; row < this.GRID_ROWS; row++) {
            for (let col = 0; col < this.GRID_COLS; col++) {
                const pixel = document.createElement('a-plane');
                const posX = startX + col * this.PIXEL_SIZE;
                const posY = startY + row * this.PIXEL_SIZE;

                pixel.setAttribute('position', `${posX} ${posY} 0`);
                pixel.setAttribute('width', this.PIXEL_SIZE * 0.95); // 0.95 for a small gap
                pixel.setAttribute('height', this.PIXEL_SIZE * 0.95);
                pixel.setAttribute('material', 'color: #FFF; opacity: 0.3; transparent: true;');
                pixel.setAttribute('class', 'clickable-pixel'); // For raycaster targeting
                
                // Store grid position in the element itself
                pixel.dataset.row = row;
                pixel.dataset.col = col;

                this.gridEntity.appendChild(pixel);
            }
        }
        this.scene.appendChild(this.gridEntity);
        console.log(`✅ Pixel grid (${this.GRID_ROWS}x${this.GRID_COLS}) created.`);
    }

    /**
     * Fetches NASA data and updates the pixel colors.
     */
    async updateData() {
        console.log("🔄 Fetching and updating pixel data...");
        const location = await this._getGPSLocation();
        if (!location) return;

        // Use the existing Pixel Hunt API to get a grid of data
        try {
            const apiBase = window.getNASAApiEndpoint();
            const response = await fetch(`${apiBase}/pixel-hunt/data?lat=${location.lat}&lon=${location.lon}&resolution=250`);
            const data = await response.json();
            
            if (data && data.pixels) {
                this.dataGrid = data.pixels;
                this._updateGridColors();
            }
        } catch (error) {
            console.error("Failed to fetch pixel grid data:", error);
        }
    }

    /**
     * Updates the color of each pixel based on its data.
     */
    _updateGridColors() {
        const pixels = this.gridEntity.querySelectorAll('.clickable-pixel');
        pixels.forEach(pixel => {
            const row = parseInt(pixel.dataset.row, 10);
            const col = parseInt(pixel.dataset.col, 10);
            
            // Map 2D grid index to 1D array from API
            const index = row * this.GRID_COLS + col;
            if (this.dataGrid[index]) {
                const pixelData = this.dataGrid[index];
                const color = this._getColorForMoisture(pixelData.moisture);
                pixel.setAttribute('material', `color: ${color}; opacity: 0.6; transparent: true;`);
            }
        });
        console.log("🎨 Grid colors updated.");
    }
    
    /**
     * Attaches click event listeners to the scene.
     */
    _attachEventListeners() {
        this.scene.addEventListener('click', (event) => {
            // Check if the clicked element is a pixel
            if (event.target.classList.contains('clickable-pixel')) {
                this._handlePixelClick(event.target);
            }
        });
    }

    /**
     * Handles the click event on a pixel.
     * @param {Element} targetEntity - The A-Frame entity that was clicked.
     */
    _handlePixelClick(targetEntity) {
        const row = parseInt(targetEntity.dataset.row, 10);
        const col = parseInt(targetEntity.dataset.col, 10);
        const index = row * this.GRID_COLS + col;

        if (this.dataGrid[index]) {
            const pixelData = this.dataGrid[index];
            console.log(`🖱️ Clicked pixel (${row}, ${col})`, pixelData);
            
            // Get position of the clicked pixel to show popup nearby
            const position = targetEntity.getAttribute('position');
            const worldPosition = this.gridEntity.object3D.localToWorld(position.clone());
            
            this.showDataPopup(pixelData, worldPosition);
        }
    }

    /**
     * Displays a data popup card in the AR scene.
     * @param {object} data - The data to display.
     * @param {object} position - The world position to display the popup.
     */
    showDataPopup(data, position) {
        if (!this.dataPopup) {
            this.dataPopup = document.createElement('a-entity');
            this.dataPopup.setAttribute('id', 'data-popup');
            this.scene.appendChild(this.dataPopup);
        }
        
        // Position the popup slightly above the clicked pixel
        this.dataPopup.setAttribute('position', `${position.x} ${position.y + 0.3} ${position.z}`);
        this.dataPopup.setAttribute('look-at', '#ar-camera');

        let popupText;
        if (data.instruction) {
            popupText = `value: ${data.instruction}; color: #FFF; width: 1.5; align: center; wrapCount: 30;`;
        } else {
             popupText = `
                value:
                💧 Soil Moisture: ${(data.moisture * 100).toFixed(1)}%
                🌿 NDVI: ${data.ndvi.toFixed(2)}
                🌡️ Surface Temp: ${data.temperature.toFixed(1)}°C
                ;
                color: #FFF; width: 1.2; align: left; lineHeight: 60;
            `;
        }

        this.dataPopup.innerHTML = `
            <a-rounded width="1.2" height="0.6" radius="0.05" material="color: #0960E1; opacity: 0.9;">
                <a-text ${popupText} position="-0.5 0.1 0.02"></a-text>
            </a-rounded>
        `;

        // Make the popup disappear after a few seconds
        setTimeout(() => {
            if (this.dataPopup) {
                this.dataPopup.innerHTML = '';
            }
        }, 8000);
    }

    /**
     * Helper to get user's GPS location.
     */
    _getGPSLocation() {
        return new Promise((resolve) => {
            if (!navigator.geolocation) {
                console.warn("Geolocation not supported, using fallback.");
                resolve({ lat: 33.4255, lon: -111.9400 }); // Phoenix, AZ fallback
                return;
            }
            navigator.geolocation.getCurrentPosition(
                (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
                (err) => {
                    console.warn(`GPS Error (${err.code}): ${err.message}. Using fallback.`);
                    resolve({ lat: 33.4255, lon: -111.9400 });
                },
                { enableHighAccuracy: true, timeout: 5000, maximumAge: 10000 }
            );
        });
    }

    /**
     * Helper to map soil moisture to a color.
     */
    _getColorForMoisture(moisture) {
        if (moisture > 0.4) return '#2E96F5'; // Wet (Blue)
        if (moisture > 0.25) return '#4CAF50'; // Optimal (Green)
        if (moisture > 0.15) return '#FFC107'; // Moderate (Yellow)
        return '#F44336'; // Dry (Red)
    }
}
