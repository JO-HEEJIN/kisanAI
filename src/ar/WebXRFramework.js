class WebXRFramework {
    constructor() {
        this.session = null;
        this.renderer = null;
        this.scene = null;
        this.camera = null;
        this.hitTestSource = null;
        this.hitTestSourceRequested = false;
        this.reticle = null;
        this.arObjects = [];
        this.voiceListening = false;

        this.onSelect = this.onSelect.bind(this);
    }

    async initialize() {
        console.log('Initializing WebXR Framework...');

        // Initialize Three.js components
        this.initializeThreeJS();

        // Create AR overlay UI
        this.createAROverlay();

        console.log('WebXR Framework initialized');
    }

    initializeThreeJS() {
        // Create scene
        this.scene = new THREE.Scene();

        // Create camera
        this.camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 20);

        // Create renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.xr.enabled = true;

        // Create reticle (targeting cursor for AR)
        const geometry = new THREE.RingGeometry(0.15, 0.2, 32).rotateX(-Math.PI / 2);
        const material = new THREE.MeshBasicMaterial();
        this.reticle = new THREE.Mesh(geometry, material);
        this.reticle.matrixAutoUpdate = false;
        this.reticle.visible = false;
        this.scene.add(this.reticle);

        // Add lighting
        const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
        light.position.set(0.5, 1, 0.25);
        this.scene.add(light);
    }

    createAROverlay() {
        // Create AR overlay container if it doesn't exist
        let arOverlay = document.getElementById('ar-overlay');
        if (!arOverlay) {
            arOverlay = document.createElement('div');
            arOverlay.id = 'ar-overlay';
            arOverlay.className = 'ar-overlay';
            document.body.appendChild(arOverlay);
        }

        // Initially hide AR overlay - will be shown when start-chat-btn is clicked
        arOverlay.style.display = 'none';
        arOverlay.style.position = 'fixed';
        arOverlay.style.top = '0';
        arOverlay.style.left = '0';
        arOverlay.style.width = '100%';
        arOverlay.style.height = '100%';
        arOverlay.style.zIndex = '9999';

        // Add AR controls
        arOverlay.innerHTML = `
            <div class="ar-controls">
                <div class="ar-top-bar">
                    <button id="ar-exit-btn" class="ar-btn ar-exit">Exit AR</button>
                    <div class="ar-mode-indicator">${this.getCurrentMode()}</div>
                    <button id="ar-voice-btn" class="ar-btn ar-voice">🎤</button>
                </div>

                <div class="ar-chat-interface">
                    <div id="ar-chat-messages" class="ar-chat-messages"></div>
                    <div class="ar-chat-input-container">
                        <input type="text" id="ar-chat-input" placeholder="Ask about your crops..." />
                        <button id="ar-send-btn" class="ar-btn">Send</button>
                    </div>
                </div>

                <div class="ar-bottom-controls">
                    <button id="ar-scan-btn" class="ar-btn ar-scan">Scan Plant</button>
                    <button id="ar-data-btn" class="ar-btn ar-data">NASA Data</button>
                    <button id="ar-help-btn" class="ar-btn ar-help">Help</button>
                </div>

                <div id="ar-plant-info" class="ar-plant-info" style="display: none;">
                    <h3 id="plant-name">Plant Identified</h3>
                    <p id="plant-details">Plant details will appear here</p>
                    <div id="plant-recommendations">Recommendations loading...</div>
                </div>
            </div>
        `;

        // Add event listeners
        this.setupARControlEvents();
    }

    setupARControlEvents() {
        const exitBtn = document.getElementById('ar-exit-btn');
        const voiceBtn = document.getElementById('ar-voice-btn');
        const scanBtn = document.getElementById('ar-scan-btn');
        const dataBtn = document.getElementById('ar-data-btn');
        const helpBtn = document.getElementById('ar-help-btn');
        const sendBtn = document.getElementById('ar-send-btn');
        const chatInput = document.getElementById('ar-chat-input');

        if (exitBtn) {
            exitBtn.addEventListener('click', () => this.exitAR());
        }

        if (voiceBtn) {
            voiceBtn.addEventListener('click', () => this.toggleVoiceRecognition());
        }

        if (scanBtn) {
            scanBtn.addEventListener('click', () => this.startPlantScan());
        }

        if (dataBtn) {
            dataBtn.addEventListener('click', () => this.showNASAData());
        }

        if (helpBtn) {
            helpBtn.addEventListener('click', () => this.showHelp());
        }

        if (sendBtn) {
            sendBtn.addEventListener('click', () => this.sendChatMessage());
        }

        if (chatInput) {
            chatInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.sendChatMessage();
                }
            });
        }
    }

    async startSession(xrSession) {
        this.session = xrSession;

        // Set up session event listeners
        this.session.addEventListener('select', this.onSelect);
        this.session.addEventListener('end', () => {
            this.hitTestSourceRequested = false;
            this.hitTestSource = null;
            this.session = null;
        });

        // Set up renderer for XR
        this.renderer.xr.setSession(this.session);

        // Request hit test source
        this.session.requestReferenceSpace('viewer').then((referenceSpace) => {
            this.session.requestHitTestSource({ space: referenceSpace }).then((source) => {
                this.hitTestSource = source;
                this.hitTestSourceRequested = true;
            });
        });

        // Start render loop
        this.renderer.setAnimationLoop(this.render.bind(this));

        // Add renderer to DOM
        document.body.appendChild(this.renderer.domElement);
    }

    render(timestamp, frame) {
        if (frame) {
            const referenceSpace = this.renderer.xr.getReferenceSpace();

            if (this.hitTestSourceRequested === false) return;

            if (this.hitTestSource) {
                const hitTestResults = frame.getHitTestResults(this.hitTestSource);

                if (hitTestResults.length > 0) {
                    const hit = hitTestResults[0];
                    this.reticle.visible = true;
                    this.reticle.matrix.fromArray(hit.getPose(referenceSpace).transform.matrix);
                } else {
                    this.reticle.visible = false;
                }
            }

            this.renderer.render(this.scene, this.camera);
        }
    }

    onSelect() {
        if (this.reticle.visible) {
            // Place AR object at reticle position
            this.placeARObject(this.reticle.position);
        }
    }

    placeARObject(position) {
        // Create a plant information marker
        const geometry = new THREE.CylinderGeometry(0.1, 0.1, 0.2, 32);
        const material = new THREE.MeshPhongMaterial({ color: 0x00ff00 });
        const marker = new THREE.Mesh(geometry, material);

        marker.position.copy(position);
        marker.userData = {
            type: 'plant-marker',
            timestamp: Date.now()
        };

        this.scene.add(marker);
        this.arObjects.push(marker);

        // Trigger plant identification
        this.identifyPlantAtPosition(position);
    }

    async identifyPlantAtPosition(position) {
        try {
            // Simulate plant identification (would use camera capture in real implementation)
            const plantData = await this.simulatePlantIdentification();

            // Show plant information
            this.showPlantInfo(plantData);

            // Notify AR ChatGPT Core
            document.dispatchEvent(new CustomEvent('plant-identified', {
                detail: { ...plantData, position }
            }));

        } catch (error) {
            console.error('Plant identification failed:', error);
        }
    }

    async simulatePlantIdentification() {
        // Simulate AI plant identification
        const plants = [
            { species: 'Triticum aestivum', commonName: 'Wheat', health: 85, stage: 'Flowering' },
            { species: 'Zea mays', commonName: 'Corn', health: 92, stage: 'Vegetative' },
            { species: 'Glycine max', commonName: 'Soybean', health: 78, stage: 'Pod Formation' },
            { species: 'Oryza sativa', commonName: 'Rice', health: 90, stage: 'Tillering' }
        ];

        return plants[Math.floor(Math.random() * plants.length)];
    }

    showPlantInfo(plantData) {
        const plantInfo = document.getElementById('ar-plant-info');
        const plantName = document.getElementById('plant-name');
        const plantDetails = document.getElementById('plant-details');
        const plantRecommendations = document.getElementById('plant-recommendations');

        if (plantInfo && plantName && plantDetails && plantRecommendations) {
            plantName.textContent = `${plantData.commonName} (${plantData.species})`;
            plantDetails.textContent = `Health: ${plantData.health}% | Stage: ${plantData.stage}`;

            // Get NASA-based recommendations
            this.getNASARecommendations(plantData).then(recommendations => {
                plantRecommendations.innerHTML = recommendations;
            });

            plantInfo.style.display = 'block';

            // Hide after 5 seconds
            setTimeout(() => {
                plantInfo.style.display = 'none';
            }, 5000);
        }
    }

    async getNASARecommendations(plantData) {
        try {
            // Get current NASA data context
            const nasaContext = await window.arChatGPTCore.getNASAContext();

            let recommendations = '<ul>';

            if (nasaContext?.soilMoisture < 30) {
                recommendations += '<li>🌊 Soil moisture low - Consider irrigation</li>';
            }

            if (nasaContext?.ndvi < 0.6) {
                recommendations += '<li>🌱 NDVI indicates stress - Check for pests/disease</li>';
            }

            if (plantData.health < 80) {
                recommendations += '<li>🏥 Plant health suboptimal - Investigate causes</li>';
            }

            recommendations += `<li>📊 Current stage: ${plantData.stage}</li>`;
            recommendations += '</ul>';

            return recommendations;

        } catch (error) {
            return '<p>Unable to load recommendations</p>';
        }
    }

    async startFieldScan() {
        console.log('Starting field scan...');

        // Update UI to show scanning mode
        const modeIndicator = document.querySelector('.ar-mode-indicator');
        if (modeIndicator) {
            modeIndicator.textContent = 'Field Scanning';
        }

        // Enable automatic plant detection
        this.enableAutoPlantDetection();

        return { status: 'scanning', mode: 'field-scan' };
    }

    enableAutoPlantDetection() {
        // Simulate automatic plant detection every 3 seconds
        this.autoScanInterval = setInterval(() => {
            if (this.session && this.reticle.visible) {
                // Simulate finding a plant
                const randomPosition = new THREE.Vector3(
                    (Math.random() - 0.5) * 2,
                    0,
                    (Math.random() - 0.5) * 2
                );
                this.identifyPlantAtPosition(randomPosition);
            }
        }, 3000);
    }

    // Chat interface methods
    sendChatMessage() {
        const chatInput = document.getElementById('ar-chat-input');
        if (chatInput && chatInput.value.trim()) {
            const message = chatInput.value.trim();
            chatInput.value = '';

            this.addChatMessage('user', message);

            // Send to AR ChatGPT Core
            console.log('Sending message to AR ChatGPT Core:', message);
            window.arChatGPTCore.sendMessage(message, { type: 'ar-chat' })
                .then(response => {
                    console.log('Received response from AR ChatGPT Core:', response);

                    // Check if response has text property
                    const responseText = response.text || response.message || response || 'No response received';
                    console.log('Response text:', responseText);

                    this.addChatMessage('assistant', responseText);
                })
                .catch(error => {
                    console.error('Chat message failed:', error);
                    this.addChatMessage('assistant', 'Sorry, I encountered an error processing your message. Please try again or check the console for details.');
                });
        }
    }

    addChatMessage(sender, text) {
        const chatMessages = document.getElementById('ar-chat-messages');
        if (chatMessages) {
            const messageDiv = document.createElement('div');
            messageDiv.className = `ar-chat-message ar-chat-${sender}`;
            messageDiv.textContent = text;
            chatMessages.appendChild(messageDiv);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    }

    // Control methods
    startPlantScan() {
        console.log('Plant scan started');

        // Show scanning feedback
        this.addChatMessage('assistant', '🔍 Starting plant scan... Point your camera at a plant.');

        // Update UI
        const scanBtn = document.getElementById('ar-scan-btn');
        if (scanBtn) {
            scanBtn.textContent = 'Scanning...';
            scanBtn.disabled = true;
        }

        // Simulate plant scanning
        setTimeout(() => {
            this.simulatePlantIdentification().then(plantData => {
                this.showPlantInfo(plantData);
                this.addChatMessage('assistant', `🌱 Plant identified: ${plantData.commonName} (Health: ${plantData.health}%)`);

                // Reset button
                if (scanBtn) {
                    scanBtn.textContent = 'Scan Plant';
                    scanBtn.disabled = false;
                }
            });
        }, 2000);

        return { status: 'scanning' };
    }

    toggleVoiceRecognition() {
        console.log('Toggle voice recognition');

        const voiceBtn = document.getElementById('ar-voice-btn');

        if (!this.voiceListening) {
            // Start voice recognition
            this.voiceListening = true;
            if (voiceBtn) voiceBtn.textContent = '🔴';

            this.addChatMessage('assistant', '🎤 Voice recognition activated. Speak now...');

            // Use ConversationalAI's voice recognition if available
            if (window.conversationalAI && window.conversationalAI.voiceEnabled) {
                const recognition = window.conversationalAI.startListening((result) => {
                    if (result.transcript) {
                        this.addChatMessage('user', result.transcript);

                        // Process the voice command
                        window.arChatGPTCore.sendMessage(result.transcript, { type: 'voice' })
                            .then(response => {
                                this.addChatMessage('assistant', response.text);
                                if (window.conversationalAI.voiceEnabled) {
                                    window.conversationalAI.speak(response.text);
                                }
                            });
                    }

                    // Reset voice button
                    this.voiceListening = false;
                    if (voiceBtn) voiceBtn.textContent = '🎤';
                });
            } else {
                // Fallback: disable voice after 3 seconds
                setTimeout(() => {
                    this.voiceListening = false;
                    if (voiceBtn) voiceBtn.textContent = '🎤';
                    this.addChatMessage('assistant', 'Voice recognition not available on this device.');
                }, 3000);
            }
        } else {
            // Stop voice recognition
            this.voiceListening = false;
            if (voiceBtn) voiceBtn.textContent = '🎤';
            this.addChatMessage('assistant', 'Voice recognition stopped.');
        }
    }

    async showNASAData() {
        console.log('Show NASA data overlay');

        try {
            // Get NASA data from AR ChatGPT Core
            const nasaContext = await window.arChatGPTCore.getNASAContext();

            if (nasaContext) {
                const locationInfo = nasaContext.location || {};
                const isGpsLocation = locationInfo.source === 'GPS';

                const dataMessage = `
📡 **Current NASA Satellite Data:**
📍 **Location:** ${isGpsLocation ? `Your GPS location (${locationInfo.lat?.toFixed(4)}°, ${locationInfo.lon?.toFixed(4)}°)` : `Default location (${locationInfo.lat}°, ${locationInfo.lon}°)`}
🗺️ **Location Source:** ${locationInfo.source || 'unknown'}
• **Soil Moisture:** ${nasaContext.soilMoisture?.toFixed(1)}% (SMAP)
• **NDVI:** ${nasaContext.ndvi?.toFixed(3)} (vegetation health)
• **Temperature:** ${nasaContext.temperature}°C
• **Data Source:** ${nasaContext.source}
• **Updated:** ${new Date(nasaContext.timestamp).toLocaleTimeString()}

${isGpsLocation ? '🎯 **Precision:** Data is for your exact location!' : '⚠️ **Note:** Using default location data. Enable GPS for precise readings.'}

💡 **Quick Analysis:**
${nasaContext.soilMoisture < 30 ? '• Soil moisture is low - consider irrigation' : '• Soil moisture looks adequate'}
${nasaContext.ndvi < 0.6 ? '• Vegetation may be stressed - investigate further' : '• Vegetation health appears normal'}
                `;

                this.addChatMessage('assistant', dataMessage);

                if (!isGpsLocation) {
                    setTimeout(() => {
                        this.addChatMessage('assistant', '🌍 **Want precise data for your location?** Please enable location services in your browser and refresh the page for GPS-accurate satellite data!');
                    }, 1000);
                }
            } else {
                this.addChatMessage('assistant', '❌ Unable to fetch NASA satellite data at the moment. Please check your connection.');
            }

        } catch (error) {
            console.error('Failed to show NASA data:', error);
            this.addChatMessage('assistant', '❌ Error loading NASA data. Please try again.');
        }
    }

    showHelp() {
        const helpMessage = `
            AR Farm Assistant Help:
            • Tap to identify plants
            • Use voice commands
            • Ask questions about your crops
            • View NASA satellite data
        `;
        this.addChatMessage('assistant', helpMessage);
    }

    exitAR() {
        console.log('Exiting AR mode');

        // Show exit message
        this.addChatMessage('assistant', '👋 Exiting AR mode. Thanks for using AR ChatGPT!');

        // Hide AR overlay
        const arOverlay = document.getElementById('ar-overlay');
        if (arOverlay) {
            arOverlay.style.display = 'none';
        }

        // End XR session if active
        if (this.session) {
            this.session.end();
        }

        // Clean up
        this.dispose();

        // Notify AR ChatGPT Core
        if (window.arChatGPTCore) {
            window.arChatGPTCore.exitARMode();
        }

        return { status: 'exited' };
    }

    getCurrentMode() {
        return window.arChatGPTCore?.currentMode || 'AR Mode';
    }

    // Cleanup
    dispose() {
        if (this.autoScanInterval) {
            clearInterval(this.autoScanInterval);
        }

        // Remove AR objects
        this.arObjects.forEach(obj => {
            this.scene.remove(obj);
        });
        this.arObjects = [];

        // Clean up Three.js resources
        if (this.renderer) {
            this.renderer.dispose();
        }
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WebXRFramework;
}