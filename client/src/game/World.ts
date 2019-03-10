import { SocketClient } from "../ws/socket";
import { Scene, Vector3, FreeCamera, Mesh, HemisphericLight } from "babylonjs";

export class World {
    private engine: BABYLON.Engine;
    private scene: Scene;
    private socket: SocketClient;

    constructor(engine: BABYLON.Engine, socket: SocketClient) {
        this.engine = engine;
        this.socket = socket;
        this.init();
        this.create();
    }

    /**
     * Initializes world variables.
     */
    private init(): void {
        this.scene = new Scene(this.engine);
    }

    /**
     * Create game objects.
     */
    private create(): void {
        this.socket.on("playerLogin", data => {
            console.log(data);
        });
        const camera = new FreeCamera(
            "camera1",
            new Vector3(0, 5, -10),
            this.scene
        );
        camera.setTarget(Vector3.Zero());
        camera.attachControl(this.engine.getRenderingCanvas(), false);
        const light = new HemisphericLight(
            "light1",
            new Vector3(0, 1, 0),
            this.scene
        );
        const sphere = Mesh.CreateSphere(
            "sphere1",
            16,
            2,
            this.scene,
            false,
            Mesh.FRONTSIDE
        );
        sphere.position.y = 1;
        const ground = Mesh.CreateGround("ground1", 6, 6, 2, this.scene, false);
    }

    /**
     * Updates anything in the world.
     */
    public update(): void {
        this.scene.render();
    }

    /**
     * Determines if world is fully loaded and executes callback param.
     * @param func callback function when world is ready
     */
    public executeWhenReady(func: () => void): void {
        if (this.scene && this.scene.isReady()) {
            func();
        } else {
            this.scene.executeWhenReady(func);
        }
    }
}
