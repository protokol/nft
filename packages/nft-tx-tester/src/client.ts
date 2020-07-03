import { Utils } from "@arkecosystem/core-kernel";

import { seeds } from "./config/testnet";
import { App } from "./types";

export class Client {
    public constructor(private config: App["config"]) {}

    public getRandomSeed() {
        return seeds[Math.floor(Math.random() * seeds.length)];
    }

    public getSeed() {
        if (this.config.peer) {
            return this.config.peer;
        }

        return this.getRandomSeed();
    }

    public async retrieveSenderWallet(sender: string, seed?: string) {
        try {
            const response = await Utils.http.get(`http://${this.getSeed()}:4003/api/wallets/${sender}`);
            return response.data.data;
        } catch (ex) {
            console.log(sender);
            console.log("retrieveSenderWallet: " + ex.message);
            console.log("Probably a cold wallet");
            return {};
        }
    }

    public async retrieveTransaction(sender, type) {
        try {
            const response = await Utils.http.get(
                `http://${this.getSeed()}:4003/api/transactions?type=${type}&senderPublicKey=${sender}`,
            );
            return response.data.data;
        } catch (ex) {
            console.log("retrieveTransaction: " + ex.message);
            return {};
        }
    }

    public async retrieveNetworktime() {
        try {
            const response = await Utils.http.get(`http://${this.getSeed()}:4003/api/node/status`);
            return response.data.data.timestamp;
        } catch (ex) {
            console.log("retrieveNetworktime: " + ex.message);
            return 0;
        }
    }

    public async retrieveHeight() {
        try {
            const response = await Utils.http.get(`http://${this.getSeed()}:4003/api/blockchain`);
            return response.data.data.block.height;
        } catch (ex) {
            console.log("retrieveHeight: " + ex.message);
            return 1;
        }
    }
    public async retrieveBidsByPublicKey(sender) {
        const response = await Utils.http.post(`http://${this.getSeed()}:4003/api/nft/exchange/bids/search`, {
            body: {
                senderPublicKey: sender,
            },
        });
        return response.data.data;
    }

    public async postTransaction(transactions) {
        try {
            if (this.config.coldrun) {
                return;
            }

            const response = await Utils.http.post(`http://${this.getSeed()}:4003/api/transactions`, {
                headers: { "Content-Type": "application/json", port: 4003 },
                body: {
                    transactions: transactions,
                },
            });

            if (response.statusCode !== 200 || response.data.error) {
                console.log(JSON.stringify(response.data));

                return response.data;
            } else {
                console.log(`Ѧ SENT ${transactions.length} transaction(s) [TYPE: ${transactions[0].type}] Ѧ`);

                return response.data;
            }
        } catch (ex) {
            console.log(JSON.stringify(ex.message));
        }
    }
}
