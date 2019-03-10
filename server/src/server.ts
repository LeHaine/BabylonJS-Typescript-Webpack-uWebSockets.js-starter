import { SocketServer, SocketClient } from "./ws/socket";

const socket = new SocketServer();

socket.on("connect", (client: SocketClient) => {
    const playerData = { x: Math.random() * 500, y: Math.random() * 500 };
    client.broadcast("playerLogin", playerData);

    console.log(`${client.getUuid()} connected`);
});
