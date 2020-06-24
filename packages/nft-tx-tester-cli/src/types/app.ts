import { Client } from "../client";
import { Filesystem } from "../filesystem";
import { Prompt } from "../prompt";
import { WalletRepository } from "../wallets-repository";

interface Config {
    network: string;
}

export interface App {
    config: Config;

    client: Client;
    walletRepository: WalletRepository;
    filesystem: Filesystem;

    nonces: any;
    prompt: Prompt;
}
