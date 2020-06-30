import { Identities, Transactions } from "@arkecosystem/crypto";

import { WalletSignType } from "./enums";
import { Wallet, WalletChange } from "./types";

export class WalletRepository {
    private wallets: Wallet[] = [];

    public constructor(wallets: Wallet[]) {
        for (const wallet of wallets) {
            if (wallet.passphrase && wallet.secondPassphrase) {
                wallet.signType = WalletSignType.SecondSignature;
            } else if (wallet.passphrases) {
                wallet.signType = WalletSignType.MultiSignature;
            } else if (wallet.passphrase) {
                wallet.signType = WalletSignType.Basic;
            } else {
                throw new Error(`Error loading wallet: ${wallet}`);
            }

            if (!wallet.publicKey) {
                wallet.publicKey = Identities.PublicKey.fromPassphrase(wallet.passphrase!);
            }

            this.wallets.push(wallet);
        }
    }

    public getWallets(): Wallet[] {
        return this.wallets;
    }

    public addWallet(wallet: Wallet) {
        this.wallets.push(wallet);
    }

    public getWallet(address: string): Wallet {
        const wallet = this.wallets.find((x) => x.address === address);

        if (!wallet) {
            throw new Error(`Wallet ${address} not found`);
        }

        return wallet;
    }

    public getRandomWallet(): Wallet {
        return this.wallets[Math.floor(Math.random() * this.wallets.length)];
    }

    public handleWalletChanges(walletChanges: WalletChange[], response) {
        if (response.data.accept) {
            for (const walletChange of walletChanges) {
                const id = Transactions.Utils.getId(walletChange.transaction.build().data);

                if (response.data.accept.includes(id)) {
                    if (walletChange.secondPassphrase) {
                        const wallet = this.getWallet(walletChange.address);

                        wallet.signType = WalletSignType.SecondSignature;
                        wallet.secondPassphrase = walletChange.secondPassphrase;
                    } else {
                        const wallet: Wallet = {
                            signType: WalletSignType.MultiSignature,
                            passphrases: walletChange.passphrases,
                            address: walletChange.address,
                            publicKey: walletChange.publicKey,
                        };

                        this.addWallet(wallet);
                    }
                }
            }
        }
    }
}
