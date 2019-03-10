class Event {
    static queue: Object;
    static fired: Array<any>;
    static data: Array<any>;
    static fire(event: string, data: any) {
        const queue = this.queue[event];
        if (typeof queue === "undefined") {
            return;
        }
        queue.forEach((callback: (arg0: any) => void) => callback(data));
        this.fired[event] = true;
        this.data[event] = data;
    }

    static on(event: string, callback: (arg0: any) => void) {
        if (this.fired[event]) {
            return callback(this.data[event]);
        }
        if (typeof this.queue[event] === "undefined") {
            this.queue[event] = [];
        }
        this.queue[event].push(callback);
    }
}

Event.queue = {};
Event.fired = [];
Event.data = [];

export class SocketClient {
    private ws: WebSocket;

    constructor(url: string) {
        this.ws = new WebSocket(url);

        this.ws.onopen = msg => {
            Event.fire("onConnect", msg);
        };

        this.ws.onmessage = msg => {
            const message = JSON.parse(msg.data);
            if (message.type) {
                Event.fire(message.type, message.data);
            }
        };
    }

    /**
     * Subscribes the client to an event.
     * @param event the event to subscribe to
     * @param cb the callback function when event is triggered
     */
    public on(event: string, cb: (data: any) => void): void {
        Event.on(event, cb);
    }

    /**
     * Subscribes the client to the onConnect event.
     * @param cb callback function when event is triggered
     */
    public onConnect(cb: (data: any) => void): void {
        Event.on("onConnect", cb);
    }

    /**
     * Emits an event with data to the server.
     * @param event the event to emit to the server
     * @param data the data to send to the server
     */
    public emit(event: string, data?: any): void {
        const message = JSON.stringify({ type: event, data });
        this.ws.send(message);
    }
}
