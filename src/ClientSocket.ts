import {Socket} from "net";

export class ClientSocket {
    private isConnected: boolean = false;
    private connectionId: string;
    private buffer: Buffer;
    private bufferLen: number;
    private channel: string = '';
    private readonly bufferSize: number = 1024 * 16;

    constructor(private socket: Socket, private sockets: Map<String, Map<String, ClientSocket>>) {
        this.socket.setNoDelay(true);
        this.socket.setKeepAlive(true, 300 * 1000);
        this.isConnected = true;
        this.connectionId = `${this.socket.remoteAddress}:${this.socket.remotePort}`;
        this.buffer = Buffer.alloc(this.bufferSize);
        this.bufferLen = 0;
        console.log(`New Client: ${this.connectionId}`);

        this.socket.on('data', (data) => this.Data(data));

        this.socket.on('error', () => this.RemoveConnection());
        this.socket.on('close', () => this.RemoveConnection());
    }


    private Data(dataRaw: Buffer): void {
        if (dataRaw.length > (this.bufferSize - this.bufferLen)) {
            console.log("Message doesn't fit the buffer. Adjust the buffer size in configuration");
            this.bufferLen = 0; // trimming buffer
            return;
        }
        this.bufferLen += dataRaw.copy(this.buffer, this.bufferLen); // keeping track of how much data we have in buffer


        let start: number;
        let end: number;
        let str: string = this.buffer.slice(0, this.bufferLen).toString();

        if ((start = str.indexOf('__SUBSCRIBE__')) !== -1 && (end = str.indexOf('__ENDSUBSCRIBE__')) !== -1) {
            // if socket was on another channel delete the old reference
            if (this.channel && this.sockets) {
                const channel: Map<String, ClientSocket> | undefined = this.sockets.get(this.channel);
                if (channel) {
                    channel.delete(this.connectionId);
                }
            }

            this.channel = str.substr(start + 13, end - (start + 13));
            this.socket.write('Hello. Noobhub online. \r\n');
            console.log('Client subscribes for channel: ' + this.channel);
            str = str.substr(end + 16);  // cut the message and remove the precedant part of the buffer since it can't be processed
            this.bufferLen = this.buffer.write(str, 0);
            if (!this.sockets.has(this.channel)) {
                this.sockets.set(this.channel, new Map<String, any>());
            }
            const channel: Map<String, ClientSocket> | undefined = this.sockets.get(this.channel);
            if (channel) {
                channel.set(this.connectionId, this);
            }
        }

        while (true) {  // this is for a case when several messages arrived in buffer

            if ((start = str.indexOf('__JSON__START__')) !== -1 && (end = str.indexOf('__JSON__END__')) !== -1) {
                var json = str.substr(start + 15, end - (start + 15));
                str = str.substr(end + 13);  // cut the message and remove the precedant part of the buffer since it can't be processed
                this.bufferLen = this.buffer.write(str, 0);
                const channel: Map<String, ClientSocket> | undefined = this.sockets.get(this.channel);
                if (channel) {
                    for (const sub of channel.values()) {
                        sub.isConnected && sub.socket.write('__JSON__START__' + json + '__JSON__END__');
                    }
                }

            } else {
                break; // if no json data found in buffer - then it is time to exit this loop
            }
        }


    }

    private RemoveConnection(): void {
        if (!this.channel || !this.sockets.get(this.channel)) {
            return;
        }
        const channel: Map<String, ClientSocket> | undefined = this.sockets.get(this.channel);
        if (channel && channel.has((this.connectionId))) {
            this.isConnected = false;
            this.socket.destroy();
            channel.delete(this.connectionId);
            console.log(this.connectionId + ' has been disconnected from channel ' + this.channel);

            if (channel.size === 0) {
                this.sockets.delete(this.channel);
                console.log('empty channel wasted')
            }
        }
    }
}
