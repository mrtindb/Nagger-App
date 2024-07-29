/*
'use strict';
const fs = require('fs');
const https = require('https');
const app = require('./app');
const port = 3000;

const sslOptions = {
    key: fs.readFileSync('ssl/key.pem'),
    cert: fs.readFileSync('ssl/cert.pem')
};

const server = https.createServer(sslOptions, app);

server.listen(port, () => {
    console.log(`HTTPS Server is listening on http://localhost:${port}`);
});

server.on('error', (err) => {
    console.error('Failed to start server:', err);
  });
*/
  'use strict';
const app = require('./app');
const port = 3000;
app.listen(port, () => {
    console.log(`Server is listening on http://localhost:${port}`);
});