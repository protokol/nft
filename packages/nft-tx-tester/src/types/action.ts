import { App } from "./app";

type Handler = (app: App, type?: number, quantity?: number) => Promise<void>;

export interface Action {
    description: string;
    handler: Handler;
}
