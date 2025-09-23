const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Serve static files
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// API endpoints for NASA data integration (future enhancement)
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'TerraData server is running',
        timestamp: new Date().toISOString()
    });
});

// Mock NASA data endpoints for development
app.get('/api/nasa/ndvi', (req, res) => {
    const { lat, lng, date } = req.query;

    // Return mock NDVI data
    const mockData = {
        coordinates: { lat: parseFloat(lat), lng: parseFloat(lng) },
        date: date || new Date().toISOString(),
        source: 'MODIS Terra (Mock)',
        data: Array.from({ length: 100 }, (_, i) => ({
            index: i,
            ndvi: 0.3 + Math.random() * 0.4,
            quality: 'good'
        }))
    };

    res.json(mockData);
});

app.get('/api/nasa/soil-moisture', (req, res) => {
    const { lat, lng, date } = req.query;

    const mockData = {
        coordinates: { lat: parseFloat(lat), lng: parseFloat(lng) },
        date: date || new Date().toISOString(),
        source: 'SMAP L3 (Mock)',
        data: Array.from({ length: 100 }, (_, i) => ({
            index: i,
            soilMoisture: 0.2 + Math.random() * 0.3,
            temperature: 25 + Math.random() * 10
        }))
    };

    res.json(mockData);
});

app.get('/api/nasa/precipitation', (req, res) => {
    const { lat, lng } = req.query;

    const mockData = {
        coordinates: { lat: parseFloat(lat), lng: parseFloat(lng) },
        source: 'GPM IMERG (Mock)',
        forecast: Array.from({ length: 7 }, (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() + i);

            return {
                date: date.toISOString().split('T')[0],
                precipitation: Math.random() < 0.3 ? Math.random() * 1.5 : 0,
                temperature: 80 + Math.random() * 20,
                humidity: 30 + Math.random() * 40
            };
        })
    };

    res.json(mockData);
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
app.listen(PORT, () => {
    console.log(`TerraData server running on http://localhost:${PORT}`);
    console.log('Press Ctrl+C to stop the server');
});

module.exports = app;