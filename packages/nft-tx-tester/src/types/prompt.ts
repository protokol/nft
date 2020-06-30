import { App } from "./app";

export type Handler = (app: App, data: string) => Promise<void>;

export interface Action {
    description: string;
    handler: Handler;
}
