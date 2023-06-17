require('dotenv').config();
const http = require('http');
const app = require('./app');
const port = process.env.PORT || 4001;

const server = http.createServer(app);
server.listen(process.env.PORT, process.env.SERVER_ADDR);
console.log(process.env.SERVER_ADDR + ':' + port);
