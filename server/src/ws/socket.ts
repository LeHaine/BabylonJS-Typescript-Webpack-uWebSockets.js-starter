import * as uuidv1 from "uuid/v1";
import * as uWS from "uWebSockets.js";
import { CONFIG } from "../config";

class SocketEvent {
    queue: { [key: string]: any[] };
    fired: { [key: string]: boolean };
    data: { [key: string]: any };
    constructor() {
        this.queue = {};
        this.fired = {};
        this.data = [];
    }

    fire(event: string, data: any) {
        const queue = this.queue[event];
        if (typeof queue === "undefined") {
            return;
        }
        queue.forEach((callback: (data: any) => void) => callback(data));
        this.fired[event] = true;
        this.data[event] = data;
    }

    on(event: string, callback: (data: any) => void) {
        if (this.fired[event]) {
            return callback(this.data[event]);
        }
        if (typeof this.queue[event] === "undefined") {
            this.queue[event] = [];
        }
        this.queue[event].push(callback);
    }
}

class SocketEntity {
    ab2str(buf: ArrayBuffer | SharedArrayBuffer, encoding = "utf8") {
        return Buffer.from(buf).toString(encoding);
    }

    str2ab(str: string) {
        const array = new Uint8Array(str.length);
        for (let i = 0; i < str.length; i++) {
            array[i] = str.charCodeAt(i);
        }
        return array.buffer;
    }
}

export class SocketClient extends SocketEntity {
    private uuid: string;
    private ws: uWS.WebSocket;
    private localEvent: SocketEvent;
    private server: SocketServer;

    constructor(uuid: string, ws: uWS.WebSocket, server: SocketServer) {
        super();
        this.uuid = uuid;
        this.ws = ws;
        this.server = server;
        this.localEvent = new SocketEvent();
    }

    /**
     * Emit an event to this specific client.
     * @param event the event to emit
     * @param data the data to send
     */
    public emit(event: string, data: any): void {
        const message = JSON.stringify({ type: event, data });
        const ab = this.str2ab(message);
        this.ws.send(ab, false, false);
    }

    /**
     * Broadcast an event to all other connected clients.
     * @param event the event to broadcast
     * @param data the data to send
     */
    public broadcast(event: string, data: any): void {
        this.server.broadcast(event, data, this);
    }

    /**
     * Subscribes the client to an event.
     * @param event the event to subscribe to
     * @param cb the callback function when event is triggered
     */
    public on(event: string, cb: (data: any) => void): void {
        this.localEvent.on(event, cb);
    }

    /**
     * Trigger a local event for this client
     * @param event the event to trigger
     * @param data the data to be sent with the triggered event
     */
    public fire(event: string, data: any): void {
        this.localEvent.fire(event, data);
    }

    /**
     * Get client UUID.
     */
    public getUuid() {
        return this.uuid;
    }
}

export class SocketServer extends SocketEntity {
    private globalEvent: SocketEvent;
    private server: uWS.TemplatedApp;
    private clients: Map<uWS.WebSocket, SocketClient>;

    constructor() {
        super();
        this.clients = new Map();
        this.globalEvent = new SocketEvent();
        this.server = uWS
            .App({
                key_file_name: "misc/key.pem",
                cert_file_name: "misc/cert.pem",
                passphrase: "1234"
            })
            .ws("/world1", {
                compression: CONFIG.compression,
                maxPayloadLength: CONFIG.maxPayloadLength * 1024 * 1024,
                idleTimeout: CONFIG.idleTimeout,
                open: (ws, req) => {
                    const client = new SocketClient(uuidv1(), ws, this);
                    this.clients.set(ws, client);
                    this.globalEvent.fire("connect", client);
                },
                message: (ws, message, isBinary) => {
                    const messageData = JSON.parse(this.ab2str(message));
                    if (messageData.type) {
                        this.globalEvent.fire(
                            messageData.type,
                            messageData.data
                        );
                        if (this.clients.has(ws)) {
                            this.clients
                                .get(ws)
                                .fire(messageData.type, messageData.data);
                        }
                    }
                },
                drain: ws => {
                    console.log(
                        "WebSocket backpressure: " + ws.getBufferedAmount()
                    );
                },
                close: (ws, code, message) => {
                    const uuid = this.clients.get(ws).getUuid();
                    this.clients.delete(ws);
                    this.globalEvent.fire("close", ws);
                    console.log(
                        `Client ${uuid} disconnected. Code: ${code} Message: ${this.ab2str(
                            message
                        )}`
                    );
                }
            })
            .any("/*", (res, req) => {
                res.end("Nothing to see here!");
            })
            .listen(CONFIG.port, token => {
                if (token) {
                    console.log("Listening to port " + CONFIG.port);
                } else {
                    console.log("Failed to listen to port " + CONFIG.port);
                }
            });
    }

    /**
     * Subscribe the server to an event.
     * @param event the event to subscribe to.
     * @param cb the callback function after the event is triggered.
     */
    on(event: string, cb: (data: any) => void) {
        this.globalEvent.on(event, cb);
    }

    /**
     * Emits an event to all connected clients.
     * @param event the event to trigger.
     * @param data the data to send with the event
     */
    emit(event: string, data: any) {
        this.clients.forEach(value => {
            value.emit(event, data);
        });
    }

    /**
     *  Broadcasts an event to all connected clients except the calling client.
     * @param event the event to trigger
     * @param data the data to send with the event
     * @param callingClient the client triggering the broadcast
     */
    broadcast(event: string, data: any, callingClient: SocketClient) {
        this.clients.forEach(value => {
            if (value.getUuid() !== callingClient.getUuid()) {
                value.emit(event, data);
            }
        });
    }
}
