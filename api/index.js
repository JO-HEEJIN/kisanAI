// Vercel Serverless Function for serving static files
const path = require('path');
const fs = require('fs');

module.exports = async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // For API routes, redirect to nasa-proxy
    if (req.url.startsWith('/api/')) {
        return require('./nasa-proxy')(req, res);
    }

    // For root path, serve index.html
    if (req.url === '/' || req.url === '') {
        const indexPath = path.join(process.cwd(), 'index.html');

        try {
            const content = fs.readFileSync(indexPath, 'utf8');
            res.setHeader('Content-Type', 'text/html');
            return res.status(200).send(content);
        } catch (error) {
            return res.status(404).send('index.html not found');
        }
    }

    // For other static files
    const filePath = path.join(process.cwd(), req.url);

    try {
        if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
            const content = fs.readFileSync(filePath);

            // Set appropriate content type
            const ext = path.extname(filePath);
            const contentTypes = {
                '.html': 'text/html',
                '.css': 'text/css',
                '.js': 'application/javascript',
                '.json': 'application/json',
                '.png': 'image/png',
                '.jpg': 'image/jpeg',
                '.gif': 'image/gif',
                '.svg': 'image/svg+xml'
            };

            res.setHeader('Content-Type', contentTypes[ext] || 'application/octet-stream');
            return res.status(200).send(content);
        }
    } catch (error) {
        console.error('File serving error:', error);
    }

    return res.status(404).send('Not found');
};