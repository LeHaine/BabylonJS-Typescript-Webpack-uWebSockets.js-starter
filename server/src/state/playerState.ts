import { EntityState } from "./entityState";

export interface PlayerState extends EntityState {
    position: BABYLON.Vector3;
}
