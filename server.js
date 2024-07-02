'use strict';
const app = require('./app');
const port = 3030;
app.listen(port, () => {
    console.log(`Server is listening on http://localhost:${port}`);
});