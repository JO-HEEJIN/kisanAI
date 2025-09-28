// AR Overlay Display System - Pixel Hunt Compatible Interface
// Displays analysis results in AR environment with interactive UI

/**
 * AR Overlay Display System
 * Creates interactive overlays for AR analysis results compatible with Pixel Hunt format
 * Provides real-time data visualization and user interaction in AR space
 */
class AROverlayDisplay {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;
        this.overlays = [];
        this.dataCards = [];
        this.uiScale = 1.0;
        this.isVisible = true;

        // UI Elements
        this.hudContainer = null;
        this.analysisPanel = null;
        this.crosshair = null;

        console.log('Initializing AR Overlay Display System...');
    }

    initialize() {
        try {
            this.createHUDElements();
            this.createCrosshair();
            this.setupEventHandlers();

            console.log('AR Overlay Display System initialized');
            return true;

        } catch (error) {
            console.error('Failed to initialize AR Overlay Display:', error);
            return false;
        }
    }

    createHUDElements() {
        // Create GUI system for AR overlays
        if (typeof BABYLON.GUI !== 'undefined') {
            // Use Babylon.js GUI if available
            this.setupBabylonGUI();
        } else {
            // Fallback to HTML overlays
            this.setupHTMLOverlays();
        }
    }

    setupBabylonGUI() {
        // Create full screen UI using Babylon.js GUI
        const advancedTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");

        // Create analysis panel container
        this.analysisPanel = new BABYLON.GUI.Rectangle("analysisPanel");
        this.analysisPanel.widthInPixels = 350;
        this.analysisPanel.heightInPixels = 200;
        this.analysisPanel.cornerRadius = 10;
        this.analysisPanel.color = "white";
        this.analysisPanel.thickness = 2;
        this.analysisPanel.background = "rgba(0, 30, 60, 0.8)";
        this.analysisPanel.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        this.analysisPanel.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
        this.analysisPanel.leftInPixels = 20;
        this.analysisPanel.topInPixels = 20;
        this.analysisPanel.isVisible = false;

        advancedTexture.addControl(this.analysisPanel);

        // Create data display text
        this.createDataDisplayElements();
    }

    setupHTMLOverlays() {
        // Create HTML-based overlay system as fallback
        this.hudContainer = document.createElement('div');
        this.hudContainer.id = 'ar-hud-container';
        this.hudContainer.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 10000;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        `;

        // Create analysis panel
        this.analysisPanel = document.createElement('div');
        this.analysisPanel.id = 'ar-analysis-panel';
        this.analysisPanel.style.cssText = `
            position: absolute;
            top: 20px;
            left: 20px;
            width: 350px;
            background: rgba(7, 23, 63, 0.9);
            border: 2px solid #2E96F5;
            border-radius: 10px;
            padding: 15px;
            color: white;
            font-size: 14px;
            backdrop-filter: blur(8px);
            transform: translateY(-100%);
            opacity: 0;
            transition: all 0.3s ease;
            pointer-events: auto;
        `;

        this.hudContainer.appendChild(this.analysisPanel);

        // Don't append to body yet - wait for activation
        // This will be added when AR is actually launched
        this.isAttachedToDOM = false;
    }

    // Add new method to attach to DOM when needed
    attachToDOM() {
        if (!this.isAttachedToDOM && this.hudContainer) {
            document.body.appendChild(this.hudContainer);
            this.isAttachedToDOM = true;
            console.log('AR Overlay attached to DOM');
        }
    }

    // Add new method to remove from DOM when exiting AR
    detachFromDOM() {
        if (this.isAttachedToDOM && this.hudContainer) {
            if (this.hudContainer.parentNode) {
                this.hudContainer.parentNode.removeChild(this.hudContainer);
            }
            this.isAttachedToDOM = false;
            console.log('AR Overlay detached from DOM');
        }
    }

    createDataDisplayElements() {
        // Create text elements for data display (Babylon.js GUI version)
        if (this.analysisPanel && typeof BABYLON.GUI !== 'undefined') {
            const stackPanel = new BABYLON.GUI.StackPanel();
            stackPanel.isVertical = true;
            stackPanel.spacing = 5;

            // Title
            const title = new BABYLON.GUI.TextBlock();
            title.text = "AR Soil Analysis";
            title.color = "white";
            title.fontSize = 16;
            title.fontWeight = "bold";
            stackPanel.addControl(title);

            this.analysisPanel.addControl(stackPanel);
            this.dataStackPanel = stackPanel;
        }
    }

    createCrosshair() {
        // Create subtle targeting crosshair for analysis (can be hidden)
        if (typeof BABYLON.GUI !== 'undefined') {
            const advancedTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("crosshair");

            this.crosshair = new BABYLON.GUI.Ellipse();
            this.crosshair.widthInPixels = 20;  // Smaller size
            this.crosshair.heightInPixels = 20;
            this.crosshair.color = "rgba(46, 150, 245, 0.3)";  // More transparent
            this.crosshair.thickness = 2;
            this.crosshair.background = "transparent";
            this.crosshair.isVisible = false;  // Hidden by default

            advancedTexture.addControl(this.crosshair);
        } else {
            // HTML fallback crosshair - much more subtle
            this.crosshair = document.createElement('div');
            this.crosshair.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                width: 8px;
                height: 8px;
                border: 1px solid rgba(46, 150, 245, 0.5);
                border-radius: 50%;
                transform: translate(-50%, -50%);
                pointer-events: none;
                z-index: 10001;
                opacity: 0.3;
                display: none;
            `;

            document.body.appendChild(this.crosshair);
        }
    }

    setupEventHandlers() {
        // Setup click/touch handlers for analysis
        if (this.hudContainer) {
            document.addEventListener('click', (event) => {
                if (event.target.closest('#ar-hud-container')) {
                    return; // Don't trigger analysis if clicking on UI
                }
                this.handleScreenTouch(event.clientX, event.clientY);
            });

            document.addEventListener('touchend', (event) => {
                if (event.changedTouches.length > 0) {
                    const touch = event.changedTouches[0];
                    this.handleScreenTouch(touch.clientX, touch.clientY);
                }
            });
        }
    }

    async handleScreenTouch(x, y) {
        // Trigger AR analysis at touch/click point
        try {
            console.log('🎯 Starting AR analysis at:', x, y);
            if (window.babylonXRFramework && window.babylonXRFramework.performARAnalysis) {
                const result = await window.babylonXRFramework.performARAnalysis(x, y);
                console.log('📊 AR analysis result:', result);
                if (result) {
                    // Use normal display methods only (no emergency modal)
                    this.displayAnalysisResult(result);
                    this.createWorldSpaceOverlay(result);
                } else {
                    console.warn('⚠️ AR analysis returned null result');
                }
            } else {
                console.error('❌ babylonXRFramework not available');
            }
        } catch (error) {
            console.error('AR analysis failed:', error);
        }
    }

    displayAnalysisResult(analysisData) {
        // Display analysis results in Pixel Hunt compatible format
        console.log('🔍 displayAnalysisResult called with:', analysisData);
        console.log('📊 analysisPanel exists:', !!this.analysisPanel);
        console.log('🎮 BABYLON.GUI available:', typeof BABYLON.GUI !== 'undefined');

        if (this.analysisPanel) {
            if (typeof BABYLON.GUI !== 'undefined') {
                console.log('🎯 Using Babylon GUI panel');
                this.updateBabylonGUIPanel(analysisData);
            } else {
                console.log('🌐 Using HTML panel');
                this.updateHTMLPanel(analysisData);
            }
        } else {
            console.warn('❌ analysisPanel not found, creating emergency HTML display');
            this.createEmergencyDisplay(analysisData);
        }
    }

    updateBabylonGUIPanel(analysisData) {
        // Update Babylon.js GUI panel with analysis data
        if (this.dataStackPanel) {
            // Clear existing data
            this.dataStackPanel.children.forEach(child => {
                if (child.name !== 'title') {
                    this.dataStackPanel.removeControl(child);
                }
            });

            // Add new data
            const data = [
                `Location: ${analysisData.gpsCoords.latitude.toFixed(4)}, ${analysisData.gpsCoords.longitude.toFixed(4)}`,
                `Type: ${analysisData.type}`,
                `Crop: ${analysisData.crop}`,
                `NDVI: ${analysisData.ndvi.toFixed(3)}`,
                `Moisture: ${analysisData.moisture.toFixed(1)}%`,
                `Temperature: ${analysisData.temperature.toFixed(1)}°C`,
                `Health: ${analysisData.health}/100`,
                `Source: ${analysisData.aiClassification.source}`
            ];

            data.forEach(text => {
                const textBlock = new BABYLON.GUI.TextBlock();
                textBlock.text = text;
                textBlock.color = "white";
                textBlock.fontSize = 12;
                textBlock.heightInPixels = 20;
                this.dataStackPanel.addControl(textBlock);
            });

            this.analysisPanel.isVisible = true;
        }
    }

    updateHTMLPanel(analysisData) {
        // Update HTML panel with analysis data
        const html = `
            <div style="margin-bottom: 10px; color: #2E96F5; font-weight: bold; font-size: 16px;">
                🛰️ AR Soil Analysis
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 12px;">
                <div>📍 Lat: ${analysisData.gpsCoords.latitude.toFixed(4)}</div>
                <div>📍 Lon: ${analysisData.gpsCoords.longitude.toFixed(4)}</div>
                <div>🌍 Type: ${analysisData.type}</div>
                <div>🌾 Crop: ${analysisData.crop}</div>
                <div>📊 NDVI: ${analysisData.ndvi.toFixed(3)}</div>
                <div>💧 Moisture: ${analysisData.moisture.toFixed(1)}%</div>
                <div>🌡️ Temp: ${analysisData.temperature.toFixed(1)}°C</div>
                <div>❤️ Health: ${analysisData.health}/100</div>
            </div>
            <div style="margin-top: 10px; font-size: 11px; color: #EAFE07;">
                🤖 Source: ${analysisData.aiClassification.source}
                ${analysisData.cropConfidence > 0 ? ` | Confidence: ${(analysisData.cropConfidence * 100).toFixed(0)}%` : ''}
            </div>
            <div style="margin-top: 8px; text-align: center;">
                <button onclick="this.parentElement.parentElement.style.opacity='0'; this.parentElement.parentElement.style.transform='translateY(-100%)'"
                        style="background: #2E96F5; color: white; border: none; padding: 5px 15px; border-radius: 5px; cursor: pointer;">
                    Close
                </button>
            </div>
        `;

        this.analysisPanel.innerHTML = html;
        this.analysisPanel.style.opacity = '1';
        this.analysisPanel.style.transform = 'translateY(0)';

        // Auto-hide after 15 seconds
        setTimeout(() => {
            if (this.analysisPanel) {
                this.analysisPanel.style.opacity = '0';
                this.analysisPanel.style.transform = 'translateY(-100%)';
            }
        }, 15000);
    }

    createWorldSpaceOverlay(analysisData) {
        // Create 3D overlay at the analysis point
        if (!this.scene || !analysisData.worldPosition) return;

        try {
            // Create floating info panel in 3D space
            const overlayPlane = BABYLON.MeshBuilder.CreatePlane(`overlay_${analysisData.index}`, {
                width: 1,
                height: 0.6
            }, this.scene);

            // Position above the analysis point
            overlayPlane.position = new BABYLON.Vector3(
                analysisData.worldPosition.x,
                analysisData.worldPosition.y + 0.5,
                analysisData.worldPosition.z
            );

            // Make it always face the camera
            overlayPlane.billboardMode = BABYLON.Mesh.BILLBOARD_ALL;

            // Create dynamic texture for the overlay content
            const dynamicTexture = new BABYLON.DynamicTexture(`overlayTexture_${analysisData.index}`, {
                width: 512,
                height: 256
            }, this.scene);

            const overlayMaterial = new BABYLON.StandardMaterial(`overlayMaterial_${analysisData.index}`, this.scene);
            overlayMaterial.diffuseTexture = dynamicTexture;
            overlayMaterial.diffuseTexture.hasAlpha = true;
            overlayMaterial.useAlphaFromDiffuseTexture = true;

            overlayPlane.material = overlayMaterial;

            // Draw content on the texture
            this.drawOverlayContent(dynamicTexture, analysisData);

            // Store overlay for cleanup
            this.overlays.push({
                mesh: overlayPlane,
                texture: dynamicTexture,
                material: overlayMaterial,
                data: analysisData
            });

            // Auto-remove after 30 seconds
            setTimeout(() => {
                this.removeOverlay(analysisData.index);
            }, 30000);

        } catch (error) {
            console.error('Failed to create world space overlay:', error);
        }
    }

    drawOverlayContent(dynamicTexture, analysisData) {
        // Draw analysis data on the dynamic texture
        const ctx = dynamicTexture.getContext();

        // Clear background
        ctx.fillStyle = 'rgba(7, 23, 63, 0.9)';
        ctx.fillRect(0, 0, 512, 256);

        // Border
        ctx.strokeStyle = '#2E96F5';
        ctx.lineWidth = 4;
        ctx.strokeRect(2, 2, 508, 252);

        // Title
        ctx.fillStyle = '#EAFE07';
        ctx.font = 'bold 24px Arial';
        ctx.fillText('🛰️ Analysis Result', 20, 40);

        // Data fields
        ctx.fillStyle = 'white';
        ctx.font = '18px Arial';
        const data = [
            `Type: ${analysisData.type}`,
            `NDVI: ${analysisData.ndvi.toFixed(3)}`,
            `Moisture: ${analysisData.moisture.toFixed(1)}%`,
            `Health: ${analysisData.health}/100`
        ];

        data.forEach((text, index) => {
            ctx.fillText(text, 20, 80 + (index * 30));
        });

        // Health color indicator
        const healthColor = analysisData.health > 70 ? '#00ff00' :
                           analysisData.health > 40 ? '#ffff00' : '#ff0000';
        ctx.fillStyle = healthColor;
        ctx.fillRect(400, 80, 80, 20);

        dynamicTexture.update();
    }

    removeOverlay(index) {
        // Remove specific overlay by index
        const overlayIndex = this.overlays.findIndex(overlay => overlay.data.index === index);
        if (overlayIndex !== -1) {
            const overlay = this.overlays[overlayIndex];

            if (overlay.mesh) overlay.mesh.dispose();
            if (overlay.texture) overlay.texture.dispose();
            if (overlay.material) overlay.material.dispose();

            this.overlays.splice(overlayIndex, 1);
        }
    }

    clearAllOverlays() {
        // Remove all overlays
        this.overlays.forEach(overlay => {
            if (overlay.mesh) overlay.mesh.dispose();
            if (overlay.texture) overlay.texture.dispose();
            if (overlay.material) overlay.material.dispose();
        });
        this.overlays = [];
    }

    setVisibility(visible) {
        // Toggle overlay visibility
        this.isVisible = visible;

        if (this.hudContainer) {
            this.hudContainer.style.display = visible ? 'block' : 'none';
        }

        this.overlays.forEach(overlay => {
            if (overlay.mesh) {
                overlay.mesh.isVisible = visible;
            }
        });
    }

    dispose() {
        // Cleanup all resources
        try {
            this.clearAllOverlays();

            if (this.hudContainer && this.hudContainer.parentNode) {
                this.hudContainer.parentNode.removeChild(this.hudContainer);
            }

            if (this.crosshair && this.crosshair.parentNode) {
                this.crosshair.parentNode.removeChild(this.crosshair);
            }

            console.log('AR Overlay Display System disposed');

        } catch (error) {
            console.error('Error disposing AR Overlay Display:', error);
        }
    }

    createEmergencyDisplay(analysisData) {
        // Create a simple HTML overlay that definitely shows
        console.log('🚨 Creating emergency display for AR results');

        // Remove any existing emergency display
        const existingDisplay = document.getElementById('emergency-ar-display');
        if (existingDisplay) {
            existingDisplay.remove();
        }

        // Create emergency display
        const emergencyDiv = document.createElement('div');
        emergencyDiv.id = 'emergency-ar-display';
        emergencyDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.9);
            color: white;
            padding: 20px;
            border-radius: 10px;
            border: 2px solid #0960E1;
            z-index: 999999;
            max-width: 90vw;
            max-height: 80vh;
            overflow-y: auto;
            font-family: 'Segoe UI', Arial, sans-serif;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
        `;

        emergencyDiv.innerHTML = `
            <div style="text-align: center; margin-bottom: 15px;">
                <h3 style="color: #0960E1; margin: 0;">🌱 AR Soil Analysis</h3>
                <button onclick="this.parentElement.parentElement.remove()"
                        style="position: absolute; top: 10px; right: 15px;
                               background: none; border: none; color: white;
                               font-size: 20px; cursor: pointer;">×</button>
            </div>
            <div style="line-height: 1.6;">
                <p><strong>📍 Location:</strong> ${analysisData.coordinates?.lat?.toFixed(4) || 'Unknown'}, ${analysisData.coordinates?.lng?.toFixed(4) || 'Unknown'}</p>
                <p><strong>💧 Soil Moisture:</strong> ${analysisData.soilMoisture?.toFixed(1) || 'N/A'}%</p>
                <p><strong>🌿 NDVI:</strong> ${analysisData.ndvi?.toFixed(3) || 'N/A'}</p>
                <p><strong>🌡️ Temperature:</strong> ${analysisData.temperature?.toFixed(1) || 'N/A'}°C</p>
                <p><strong>🌱 Terrain:</strong> ${analysisData.terrainType || 'Unknown'}</p>
                <p><strong>🔬 Analysis Time:</strong> ${new Date().toLocaleTimeString()}</p>
            </div>
            <div style="text-align: center; margin-top: 15px;">
                <button onclick="this.parentElement.parentElement.remove()"
                        style="background: #0960E1; color: white; border: none;
                               padding: 10px 20px; border-radius: 5px; cursor: pointer;">Close</button>
            </div>
        `;

        document.body.appendChild(emergencyDiv);
        console.log('✅ Emergency AR display created and added to page');

        // Auto-remove after 10 seconds
        setTimeout(() => {
            if (emergencyDiv.parentNode) {
                emergencyDiv.remove();
                console.log('🔄 Emergency display auto-removed');
            }
        }, 10000);
    }
}

// Make AROverlayDisplay globally available
window.AROverlayDisplay = AROverlayDisplay;