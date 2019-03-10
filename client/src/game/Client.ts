import { fsm, Events } from "./../main";
import { SocketClient } from "./../ws/socket";
import { Engine } from "babylonjs";
import { World } from "./World";

export class Client {
    private canvas: any;
    private engine: Engine;
    private world: World;
    private socket: SocketClient;

    constructor(canvasId: string, socket: SocketClient) {
        this.canvas = document.getElementById(canvasId);
        this.socket = socket;
        this.engine = new Engine(this.canvas, true);
        this.world = new World(this.engine, this.socket);

        window.addEventListener("resize", () => {
            this.engine.resize();
        });
    }

    /**
     * Any initial loading of the client is done here.
     */
    public load(): void {
        this.world.executeWhenReady(() => {
            fsm.input(Events.GAME_LOADED);
        });
    }

    /**
     * Any initial game state initialization is done here.
     */
    public initGameState(): void {
        fsm.input(Events.STATE_INIT_DONE);
    }

    /**
     * Renders and updates the world.
     */
    public run(): void {
        this.engine.runRenderLoop(() => {
            let deltaTime: number = this.engine.getDeltaTime();
            this.world.update();
        });
    }
}
