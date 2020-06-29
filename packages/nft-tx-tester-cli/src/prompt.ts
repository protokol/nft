import { App } from "./types";

export class Prompt {
    public constructor(private app: App) {}

    public prompt(question, callback: Function): Promise<void> {
        return new Promise((resolve) => {
            const stdin = process.stdin;
            const stdout = process.stdout;

            stdin.resume();
            stdout.write(question);

            stdin.once("data", async (data) => {
                await callback(this.app, data.toString().trim());

                resolve();
            });
        });
    }
}
