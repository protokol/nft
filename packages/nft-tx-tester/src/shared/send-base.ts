import { Command, flags } from "@oclif/command";

import { sendTransaction } from "../actions";
import { Client } from "../client";
import { config as defaultConfig } from "../config/config";
import { Filesystem } from "../filesystem";
import { App } from "../types";
import { WalletRepository } from "../wallets-repository";

export abstract class SendBase extends Command {
	public static defaultDescription = `${sendTransaction.description}: `;
	public static defaultFlags = {
		help: flags.help({ char: "h" }),
		quantity: flags.integer({ char: "q", description: "Number of transactions", default: 1 }),
		passphrase: flags.string({ char: "p", description: "Sender passphrase" }),
		fee: flags.string({ char: "f", description: "Transaction fee" }),
		startNonce: flags.integer({ char: "n", description: "Start nonce" }),
		vendorField: flags.string({ description: "Vendor field" }),
		peer: flags.string({ description: "Peer seed node" }),
		network: flags.string({ description: "Network" }),
	};

	protected type: number | undefined;

	public async run() {
		const { flags }: { flags: any } = this.parse(this.getCommand());

		const filesystem = new Filesystem();

		const config = this.prepareConfig(defaultConfig, flags);

		if (flags.passphrase) {
			config.passphrase = flags.passphrase;
		}
		if (flags.fee) {
			config.fee = flags.fee;
		}
		if (flags.startNonce) {
			config.startNonce = flags.startNonce;
		}
		if (flags.vendorField) {
			config.vendorField.value = flags.vendorField;
		}
		if (flags.peer) {
			config.peer = flags.peer;
		}
		if (flags.network) {
			config.network = flags.network;
		}

		const app: App = {
			config,
			client: new Client(config),
			walletRepository: new WalletRepository(await filesystem.loadWallets(config.network)),
			filesystem: filesystem,
			nonces: {},
		};

		await sendTransaction.handler(app, this.type, flags.quantity);
	}

	protected abstract prepareConfig(config, flags): typeof defaultConfig;

	protected abstract getCommand(): any;
}
