import {AddressInfo, createServer, Server} from 'net';
import {ClientSocket} from "./ClientSocket";

const sockets: Map<String, Map<String, ClientSocket>> = new Map<String, Map<String, ClientSocket>>();

process.on("uncaughtException", (err) => {
    console.log('Exception: ' + err);
});

const server: Server = createServer();

server.on('connection', (socket) => {
    new ClientSocket(socket, sockets);
});

server.on('listening', () => {
    const address: AddressInfo = <AddressInfo>server.address();
    console.log('NoobHub on ' + address.address + ':' + address.port)
});
server.listen(1337, '::');

