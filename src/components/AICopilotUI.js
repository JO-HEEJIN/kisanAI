/**
 * AI Copilot User Interface Component
 * Provides natural language search interface for farmland
 */

class AICopilotUI {
    constructor(containerId) {
        this.containerId = containerId;
        this.container = null;
        this.copilotService = null;
        this.isVoiceSupported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
        this.isListening = false;
        this.recognition = null;
        this.currentResults = [];
        this.initialize();
    }

    /**
     * Initialize the AI Copilot UI
     */
    async initialize() {
        try {
            this.container = document.getElementById(this.containerId);
            if (!this.container) {
                console.error('AI Copilot container not found');
                return;
            }

            // Initialize AI service
            if (typeof AICopilotService === 'undefined') {
                throw new Error('AICopilotService is not loaded. Make sure the script is loaded before AICopilotUI.');
            }
            this.copilotService = new AICopilotService();

            // Create UI
            this.createInterface();
            this.setupEventListeners();
            this.setupVoiceRecognition();

            // Check for OpenAI API key
            this.checkOpenAIKey();

            console.log('🤖 AI Copilot UI initialized successfully');
        } catch (error) {
            console.error('Failed to initialize AI Copilot UI:', error);
        }
    }

    /**
     * Create the complete AI Copilot interface
     */
    createInterface() {
        this.container.innerHTML = `
            <div class="ai-copilot-container">
                <!-- Header -->
                <div class="ai-copilot-header">
                    <div class="ai-avatar">
                        <div class="ai-avatar-circle">🤖</div>
                        <div class="ai-status" id="aiStatus">Ready</div>
                    </div>
                    <h2>🚀 AI Farm Navigator</h2>
                    <p>Ask me anything about farmland investment in natural language</p>

                    <!-- OpenAI API Key Setup -->
                    <div id="openai-setup" style="margin: 10px 0; padding: 10px; background: rgba(255,255,255,0.1); border-radius: 5px; display: none;">
                        <p style="font-size: 12px; margin: 5px 0;">🔑 OpenAI API Key not set. <a href="#" id="setup-api-key" style="color: #2E96F5;">Set up now</a> for GPT-4 responses.</p>
                    </div>
                </div>

                <!-- Search Interface -->
                <div class="ai-search-section">
                    <div class="search-input-container">
                        <input
                            type="text"
                            id="aiSearchInput"
                            placeholder="Ask me: 'What's my soil moisture?' or 'Should I irrigate today?' or 'Find corn-suitable land in Iowa'"
                            class="ai-search-input"
                        />
                        <button id="voiceSearchBtn" class="voice-search-btn ${!this.isVoiceSupported ? 'disabled' : ''}">
                            <span id="voiceIcon">🎤</span>
                        </button>
                        <button id="searchBtn" class="search-btn">
                            <span>Search</span>
                            <div class="search-loader" id="searchLoader"></div>
                        </button>
                    </div>

                    <!-- Sample Queries -->
                    <div class="sample-queries">
                        <h4>💡 Try these examples:</h4>
                        <div class="sample-buttons" id="sampleButtons">
                            <!-- Populated dynamically -->
                        </div>
                    </div>
                </div>

                <!-- Chat History -->
                <div class="ai-chat-container" id="aiChatContainer">
                    <div class="welcome-message">
                        <div class="ai-message">
                            <div class="message-avatar">🌾</div>
                            <div class="message-content">
                                <h3>🌾 Welcome to AI Farm Assistant!</h3>
                                <p>🤖 I'm your AI-powered agricultural expert, integrated with real-time NASA satellite data.</p>

                                <div style="margin: 15px 0;">
                                    <strong>🛰️ What I can help you with:</strong>
                                    <ul style="margin: 10px 0; padding-left: 20px;">
                                        <li>Crop health analysis using NDVI data</li>
                                        <li>Soil moisture recommendations (SMAP)</li>
                                        <li>Irrigation timing and amounts</li>
                                        <li>Plant identification and disease diagnosis</li>
                                        <li>Growth stage monitoring</li>
                                        <li>Weather-based farming advice</li>
                                        <li>Farmland investment opportunities</li>
                                        <li>Climate risk assessment</li>
                                    </ul>
                                </div>

                                <div style="margin: 15px 0;">
                                    <strong>💬 Try asking me:</strong>
                                    <ul style="margin: 10px 0; padding-left: 20px; font-style: italic;">
                                        <li>"What's my soil moisture level?"</li>
                                        <li>"Should I water my crops today?"</li>
                                        <li>"How is my crop health looking?"</li>
                                        <li>"Find farmland under $3k/acre with water rights"</li>
                                        <li>"Show me climate-resilient areas for corn"</li>
                                    </ul>
                                </div>

                                <p style="margin-top: 15px;">🚀 Ready to optimize your farm with space-age technology? Just type your question below!</p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Results Section -->
                <div class="ai-results-section" id="aiResultsSection" style="display: none;">
                    <div class="results-header">
                        <h3 id="resultsTitle">Search Results</h3>
                        <button id="viewOnGlobeBtn" class="view-globe-btn">🌍 View on 3D Globe</button>
                    </div>
                    <div class="results-content" id="resultsContent">
                        <!-- Results populated here -->
                    </div>
                    <div class="results-actions">
                        <button id="exportResultsBtn" class="export-btn">📊 Export Results</button>
                        <button id="compareBtn" class="compare-btn">⚖️ Compare Top 3</button>
                        <button id="roiAnalysisBtn" class="roi-btn">💰 ROI Analysis</button>
                    </div>
                </div>

                <!-- Voice Listening Indicator -->
                <div class="voice-listening-indicator" id="voiceIndicator" style="display: none;">
                    <div class="voice-animation">
                        <div class="voice-circle"></div>
                        <div class="voice-circle"></div>
                        <div class="voice-circle"></div>
                    </div>
                    <p>Listening... Speak now!</p>
                    <button id="stopListeningBtn">Stop Listening</button>
                </div>
            </div>
        `;

        // Load sample queries
        this.loadSampleQueries();
    }

    /**
     * Load sample queries as clickable buttons
     */
    loadSampleQueries() {
        const sampleButtons = document.getElementById('sampleButtons');
        const queries = this.copilotService.getSampleQueries();

        sampleButtons.innerHTML = queries.map(query =>
            `<button class="sample-query-btn" data-query="${query}">${query}</button>`
        ).join('');
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Search button
        const searchBtn = document.getElementById('searchBtn');
        const searchInput = document.getElementById('aiSearchInput');

        searchBtn.addEventListener('click', () => this.performSearch());
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.performSearch();
        });

        // Voice search button
        const voiceBtn = document.getElementById('voiceSearchBtn');
        if (this.isVoiceSupported) {
            voiceBtn.addEventListener('click', () => this.toggleVoiceSearch());
        }

        // Sample query buttons
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('sample-query-btn')) {
                const query = e.target.dataset.query;
                document.getElementById('aiSearchInput').value = query;
                this.performSearch();
            }
        });

        // Results actions
        document.addEventListener('click', (e) => {
            if (e.target.id === 'viewOnGlobeBtn') this.viewResultsOnGlobe();
            if (e.target.id === 'exportResultsBtn') this.exportResults();
            if (e.target.id === 'compareBtn') this.compareTopResults();
            if (e.target.id === 'roiAnalysisBtn') this.performROIAnalysis();
        });
    }

    /**
     * Setup voice recognition
     */
    setupVoiceRecognition() {
        if (!this.isVoiceSupported) return;

        const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
        this.recognition = new SpeechRecognition();

        this.recognition.continuous = false;
        this.recognition.interimResults = false;
        this.recognition.lang = 'en-US';

        this.recognition.onstart = () => {
            console.log('🎤 Voice recognition started');
            this.isListening = true;
            this.updateVoiceUI(true);
        };

        this.recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            console.log('🎤 Voice input:', transcript);

            document.getElementById('aiSearchInput').value = transcript;
            this.performSearch();
        };

        this.recognition.onerror = (event) => {
            console.error('Voice recognition error:', event.error);
            this.isListening = false;
            this.updateVoiceUI(false);
        };

        this.recognition.onend = () => {
            console.log('🎤 Voice recognition ended');
            this.isListening = false;
            this.updateVoiceUI(false);
        };

        // Stop listening button
        document.addEventListener('click', (e) => {
            if (e.target.id === 'stopListeningBtn') {
                this.recognition.stop();
            }
        });
    }

    /**
     * Toggle voice search
     */
    toggleVoiceSearch() {
        if (this.isListening) {
            this.recognition.stop();
        } else {
            this.recognition.start();
        }
    }

    /**
     * Update voice UI state
     */
    updateVoiceUI(listening) {
        const voiceIcon = document.getElementById('voiceIcon');
        const voiceIndicator = document.getElementById('voiceIndicator');
        const status = document.getElementById('aiStatus');

        if (listening) {
            voiceIcon.textContent = '🔴';
            voiceIndicator.style.display = 'flex';
            status.textContent = 'Listening...';
        } else {
            voiceIcon.textContent = '🎤';
            voiceIndicator.style.display = 'none';
            status.textContent = 'Ready';
        }
    }

    /**
     * Perform AI search
     */
    async performSearch() {
        const searchInput = document.getElementById('aiSearchInput');
        const query = searchInput.value.trim();

        if (!query) return;

        console.log('🔍 Performing AI search for:', query);

        // Update UI to show loading
        this.showSearchLoading(true);
        this.addUserMessage(query);

        try {
            // Process query with AI service
            const response = await this.copilotService.processQuery(query);

            // Add AI response to chat
            this.addAIMessage(response.explanation, response);

            // Show results
            this.displayResults(response);

            // Clear input
            searchInput.value = '';

        } catch (error) {
            console.error('Search error:', error);
            this.addAIMessage('Sorry, I encountered an error processing your request. Please try again.');
        } finally {
            this.showSearchLoading(false);
        }
    }

    /**
     * Show/hide search loading state
     */
    showSearchLoading(loading) {
        const searchBtn = document.getElementById('searchBtn');
        const loader = document.getElementById('searchLoader');
        const status = document.getElementById('aiStatus');

        if (loading) {
            searchBtn.classList.add('loading');
            loader.style.display = 'block';
            status.textContent = 'Searching...';
        } else {
            searchBtn.classList.remove('loading');
            loader.style.display = 'none';
            status.textContent = 'Ready';
        }
    }

    /**
     * Add user message to chat
     */
    addUserMessage(message) {
        const chatContainer = document.getElementById('aiChatContainer');

        const messageDiv = document.createElement('div');
        messageDiv.className = 'user-message';
        messageDiv.innerHTML = `
            <div class="message-avatar">👤</div>
            <div class="message-content">
                <p>${message}</p>
                <span class="message-time">${new Date().toLocaleTimeString()}</span>
            </div>
        `;

        chatContainer.appendChild(messageDiv);
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    /**
     * Add AI message to chat
     */
    addAIMessage(message, data = null) {
        const chatContainer = document.getElementById('aiChatContainer');

        const messageDiv = document.createElement('div');
        messageDiv.className = 'ai-message';

        let additionalInfo = '';

        // Handle agricultural/farming responses
        if (data && data.type === 'agricultural') {
            // Display NASA satellite data if available
            if (data.data) {
                additionalInfo = `
                    <div class="message-summary">
                        ${data.data.location ? `
                        <div class="summary-stat location-info">
                            <span class="stat-label">📍 Location:</span>
                            <span class="stat-value">${data.data.location.latitude.toFixed(4)}°, ${data.data.location.longitude.toFixed(4)}° (${data.data.location.source})</span>
                        </div>` : ''}
                        <div class="summary-stat">
                            <span class="stat-label">🛰️ Soil Moisture:</span>
                            <span class="stat-value">${data.data.soilMoisture?.toFixed(1) || 'N/A'}%</span>
                        </div>
                        <div class="summary-stat">
                            <span class="stat-label">🌿 NDVI:</span>
                            <span class="stat-value">${data.data.ndvi?.toFixed(3) || 'N/A'}</span>
                        </div>
                        <div class="summary-stat">
                            <span class="stat-label">🌡️ Temperature:</span>
                            <span class="stat-value">${data.data.temperature || 'N/A'}°C</span>
                        </div>
                    </div>`;
            }

            // Display recommendations if available
            if (data.recommendations && data.recommendations.length > 0) {
                additionalInfo += `
                    <div class="recommendations">
                        <strong>📋 Recommendations:</strong>
                        <ul style="margin: 10px 0; padding-left: 20px;">
                            ${data.recommendations.map(rec => `<li>${rec}</li>`).join('')}
                        </ul>
                    </div>`;
            }

            // Show data source
            if (data.source) {
                additionalInfo += `
                    <div class="data-source" style="margin-top: 10px; font-size: 0.9em; color: #888;">
                        Source: ${data.source}
                    </div>`;
            }
        }
        // Handle farmland search results
        else if (data && data.totalResults > 0) {
            additionalInfo = `
                <div class="message-summary">
                    <div class="summary-stat">
                        <span class="stat-label">Results:</span>
                        <span class="stat-value">${data.totalResults}</span>
                    </div>
                    <div class="summary-stat">
                        <span class="stat-label">Avg Price:</span>
                        <span class="stat-value">$${Math.round(data.averagePrice).toLocaleString()}/acre</span>
                    </div>
                    ${data.bestMatch ? `
                    <div class="summary-stat">
                        <span class="stat-label">Best ROI:</span>
                        <span class="stat-value">${data.bestMatch.roi}%</span>
                    </div>
                    ` : ''}
                </div>
            `;
        }

        messageDiv.innerHTML = `
            <div class="message-avatar">🤖</div>
            <div class="message-content">
                <p>${message}</p>
                ${additionalInfo}
                <span class="message-time">${new Date().toLocaleTimeString()}</span>
            </div>
        `;

        chatContainer.appendChild(messageDiv);
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    /**
     * Display search results
     */
    displayResults(response) {
        const resultsSection = document.getElementById('aiResultsSection');
        const resultsContent = document.getElementById('resultsContent');
        const resultsTitle = document.getElementById('resultsTitle');

        // Hide results section for agricultural queries
        if (response.type === 'agricultural') {
            resultsSection.style.display = 'none';
            return;
        }

        this.currentResults = response.results || [];

        if (!response.results || response.results.length === 0) {
            resultsSection.style.display = 'none';
            return;
        }

        resultsTitle.textContent = `Found ${response.results.length} Properties`;
        resultsSection.style.display = 'block';

        resultsContent.innerHTML = response.results.map(farm => `
            <div class="result-card" data-farm-id="${farm.id}">
                <div class="result-header">
                    <h4>${farm.name}</h4>
                    <div class="result-price">$${farm.pricePerAcre.toLocaleString()}/acre</div>
                </div>
                <div class="result-details">
                    <div class="result-location">📍 ${farm.location}</div>
                    <div class="result-specs">
                        <span class="spec">🌾 ${farm.acres} acres</span>
                        <span class="spec">💰 ${farm.roi}% ROI</span>
                        <span class="spec">🌱 Soil: ${farm.soilQuality}/100</span>
                        <span class="spec">☔ ${farm.droughtRisk} drought risk</span>
                    </div>
                    <div class="result-features">
                        ${farm.waterRights ? '<span class="feature">💧 Water Rights</span>' : ''}
                        ${farm.organic ? '<span class="feature">🌿 Organic</span>' : ''}
                        <span class="feature">🌱 NDVI: ${farm.ndvi}</span>
                    </div>
                </div>
                <div class="result-actions">
                    <button class="result-btn" onclick="aiCopilotUI.viewFarmDetails(${farm.id})">View Details</button>
                    <button class="result-btn" onclick="aiCopilotUI.calculateROI(${farm.id})">Calculate ROI</button>
                    <button class="result-btn" onclick="aiCopilotUI.viewOnGlobe(${farm.id})">View on Globe</button>
                </div>
            </div>
        `).join('');
    }

    /**
     * View results on 3D globe
     */
    viewResultsOnGlobe() {
        if (this.currentResults.length === 0) return;

        // Switch to 3D globe tab
        if (typeof window.app !== 'undefined' && window.app.switchTab) {
            window.app.switchTab('farm-globe-3d');

            // Wait for tab to load, then highlight farms
            setTimeout(() => {
                this.highlightFarmsOnGlobe(this.currentResults);
            }, 1000);
        }
    }

    /**
     * Highlight search results on 3D globe
     */
    highlightFarmsOnGlobe(farms) {
        // This would integrate with the FarmGlobe3D component
        if (typeof window.farmGlobe3D !== 'undefined') {
            farms.forEach(farm => {
                window.farmGlobe3D.highlightFarm(farm.coordinates, farm);
            });
        }
    }

    /**
     * View individual farm details
     */
    viewFarmDetails(farmId) {
        const farm = this.currentResults.find(f => f.id === farmId);
        if (!farm) return;

        console.log('Viewing details for farm:', farm);
        // This would open a detailed view modal or switch to a details page
    }

    /**
     * Calculate ROI for specific farm
     */
    calculateROI(farmId) {
        const farm = this.currentResults.find(f => f.id === farmId);
        if (!farm) return;

        console.log('Calculating ROI for farm:', farm);
        // This would integrate with ROI calculator
    }

    /**
     * View specific farm on globe
     */
    viewOnGlobe(farmId) {
        const farm = this.currentResults.find(f => f.id === farmId);
        if (!farm) return;

        this.viewResultsOnGlobe();
        // Focus on specific farm
    }

    /**
     * Export search results
     */
    exportResults() {
        if (this.currentResults.length === 0) return;

        const csv = this.generateCSV(this.currentResults);
        this.downloadCSV(csv, 'farmland_search_results.csv');
    }

    /**
     * Generate CSV from results
     */
    generateCSV(results) {
        const headers = ['Name', 'Location', 'Acres', 'Price per Acre', 'Total Price', 'ROI %', 'Soil Quality', 'Drought Risk', 'Water Rights', 'Organic'];
        const rows = results.map(farm => [
            farm.name,
            farm.location,
            farm.acres,
            farm.pricePerAcre,
            farm.totalPrice,
            farm.roi,
            farm.soilQuality,
            farm.droughtRisk,
            farm.waterRights ? 'Yes' : 'No',
            farm.organic ? 'Yes' : 'No'
        ]);

        return [headers, ...rows].map(row =>
            row.map(cell => `"${cell}"`).join(',')
        ).join('\n');
    }

    /**
     * Download CSV file
     */
    downloadCSV(csvContent, fileName) {
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');

        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', fileName);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }

    /**
     * Compare top 3 results
     */
    compareTopResults() {
        if (this.currentResults.length < 2) return;

        const topResults = this.currentResults.slice(0, 3);
        console.log('Comparing top results:', topResults);
        // This would open a comparison interface
    }

    /**
     * Perform ROI analysis on all results
     */
    performROIAnalysis() {
        if (this.currentResults.length === 0) return;

        console.log('Performing ROI analysis on all results');
        // This would integrate with advanced ROI analysis tools
    }

    /**
     * Check for OpenAI API key and show setup prompt
     */
    checkOpenAIKey() {
        const apiKey = localStorage.getItem('openai_api_key');
        const setupDiv = document.getElementById('openai-setup');

        if (!apiKey && setupDiv) {
            setupDiv.style.display = 'block';

            // Add setup link handler
            const setupLink = document.getElementById('setup-api-key');
            if (setupLink) {
                setupLink.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.showAPIKeySetup();
                });
            }
        } else if (apiKey && setupDiv) {
            setupDiv.style.display = 'none';
        }
    }

    /**
     * Show API key setup dialog
     */
    showAPIKeySetup() {
        const apiKey = prompt('Enter your OpenAI API key (sk-...):\n\nThis will enable GPT-4 responses with NASA satellite data integration.');

        if (apiKey && apiKey.startsWith('sk-')) {
            localStorage.setItem('openai_api_key', apiKey);
            const setupDiv = document.getElementById('openai-setup');
            if (setupDiv) {
                setupDiv.style.display = 'none';
            }
            alert('✅ OpenAI API key saved! You can now get GPT-4 powered responses.');

            // Update status
            const status = document.getElementById('aiStatus');
            if (status) {
                status.textContent = 'GPT-4 Ready';
                status.style.color = '#30D158';
            }
        } else if (apiKey) {
            alert('❌ Invalid API key. Please enter a valid OpenAI API key starting with "sk-"');
        }
    }
}

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AICopilotUI;
}

// Global instance for browser use
if (typeof window !== 'undefined') {
    window.AICopilotUI = AICopilotUI;
}