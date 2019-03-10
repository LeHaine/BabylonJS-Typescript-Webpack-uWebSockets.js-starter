import { SocketClient } from "./ws/socket";
import { Server } from "./server";
import { StateMachine } from "./modules/state_machine";
import { Client } from "./game/Client";

export enum States {
    CONNECTING_TO_SERVER,
    LOADING_GAME,
    INIT_GAME_STATE,
    RUN_GAME,
    DEAD
}

export enum Events {
    CONNECTED,
    GAME_LOADED,
    STATE_INIT_DONE
}

export let fsm = new StateMachine<States, Events>({
    initial: States.CONNECTING_TO_SERVER,
    events: [
        {
            name: Events.CONNECTED,
            from: States.CONNECTING_TO_SERVER,
            to: States.LOADING_GAME
        },
        {
            name: Events.GAME_LOADED,
            from: States.LOADING_GAME,
            to: States.INIT_GAME_STATE
        },
        {
            name: Events.STATE_INIT_DONE,
            from: States.INIT_GAME_STATE,
            to: States.RUN_GAME
        }
    ]
});

let server: Server;
let game: Client;
let socket: SocketClient;

window.addEventListener("DOMContentLoaded", () => {
    server = new Server(sc => {
        socket = sc;
    });

    fsm.onEnter(States.LOADING_GAME, () => {
        console.log("Create BabylonJS Game");
        game = new Client("renderCanvas", socket);
        game.load();
    });

    fsm.onEnter(States.INIT_GAME_STATE, () => {
        console.log("Initilize Game State from Server");
        game.initGameState();
    });

    fsm.onEnter(States.RUN_GAME, () => {
        game.run();
    });
});
