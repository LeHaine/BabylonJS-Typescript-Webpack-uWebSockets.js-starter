import { SocketClient } from "./ws/socket";
import { fsm, Events } from "./main";

export class Server {
    private socket: SocketClient;

    constructor(onConnectCallback: (socket: SocketClient) => void) {
        this.socket = new SocketClient("ws://localhost:9001/world1");
        this.socket.onConnect(() => {
            onConnectCallback(this.socket);
            fsm.input(Events.CONNECTED);
        });
    }
}
