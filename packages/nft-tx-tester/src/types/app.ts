import { Client } from "../client";
import { Filesystem } from "../filesystem";
import { Prompt } from "../prompt";
import { WalletRepository } from "../wallets-repository";

export interface App {
    config: any;
    client: Client;
    walletRepository: WalletRepository;
    filesystem: Filesystem;
    nonces: any;
    prompt: Prompt;
}
