"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const net_1 = require("net");
const ClientSocket_1 = require("./ClientSocket");
const sockets = new Map();
process.on("uncaughtException", (err) => {
    console.log('Exception: ' + err);
});
const server = net_1.createServer();
server.on('connection', (socket) => {
    new ClientSocket_1.ClientSocket(socket, sockets);
});
server.on('listening', () => {
    const address = server.address();
    console.log('NoobHub on ' + address.address + ':' + address.port);
});
server.listen(1337, '::');
