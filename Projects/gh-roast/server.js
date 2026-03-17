const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 5002;

const server = http.createServer((req, res) => {
    if (req.url === '/' && req.method === 'GET') {
        const filePath = path.join(__dirname, 'public_gh-roast/index.html');

        fs.readFile(filePath, (err, data) => {
            if (err) {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('Internal Server Error');
                return;
            }

            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(data);
        });
    } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found');
    }
});

server.listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
});