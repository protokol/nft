import * as MagistrateCrypto from "@arkecosystem/core-magistrate-crypto";
import { Crypto, Enums, Identities, Interfaces, Managers, Transactions, Utils } from "@arkecosystem/crypto";

// import assert from "assert";
import { builders } from "./builders";
import { TransactionType, WalletSignType } from "./enums";
import { App, ExtendedWallet, WalletChange } from "./types";

export class Builder {
    public constructor(private app: App) {}

    public async buildTransaction(type: number, quantity: number, splitInput: string[]) {
        await this.configureCrypto();

        const { builder } = builders[type];
        if (!builder) {
            throw new Error("Unknown type");
        }

        const walletChanges: WalletChange[] = [];

        let senderWallet = (this.app.config.passphrase
            ? this.app.walletRepository.getWallet(this.app.config.passphrase)
            : this.app.walletRepository.getRandomWallet()) as ExtendedWallet;

        const recipientWallet = (this.app.config.recipientId
            ? this.app.walletRepository.getWallet(this.app.config.recipientId)
            : this.app.walletRepository.getRandomWallet()) as ExtendedWallet;
        const recipientId = recipientWallet.address;

        senderWallet = {
            ...senderWallet,
            ...(await this.app.client.retrieveSenderWallet(Identities.Address.fromPublicKey(senderWallet.publicKey))),
        };

        const transactions: Interfaces.ITransactionJson[] = [];

        for (let i = 0; i < quantity; i++) {
            let nonce = this.app.nonces[senderWallet.publicKey];
            if (!nonce) {
                let senderNonce = senderWallet.nonce;
                if (this.app.config.multiSignature.enabled) {
                    senderNonce = (await this.app.client.retrieveSenderWallet(this.getMultiSignatureAddress().address))
                        .nonce;
                }

                nonce = Utils.BigNumber.make(this.app.config.startNonce || senderNonce || 0).plus(1);
            } else {
                nonce = nonce.plus(1);
            }
            this.app.nonces[senderWallet.publicKey] = nonce;

            const transaction = builder().nonce(nonce.toFixed()).senderPublicKey(senderWallet.publicKey);

            if (this.app.config.fee) {
                transaction.fee(this.app.config.fee);
            }

            if (type === TransactionType.Transfer) {
                transaction.recipientId(recipientId);
                transaction.amount(this.app.config.amount);
                transaction.expiration(this.app.config.expiration || 0);
            } else if (type === TransactionType.SecondSignature) {
                const secondPassphrase = this.app.config.secondPassphrase || "second passphrase";
                transaction.signatureAsset(secondPassphrase);

                walletChanges.push({
                    transaction: transaction,
                    address: senderWallet.address,
                    publicKey: undefined || "", // TODO
                    secondPassphrase,
                });
            } else if (type === Enums.TransactionType.DelegateRegistration) {
                const username = this.app.config.delegateName || `delegate.${senderWallet.publicKey.slice(0, 10)}`;
                transaction.usernameAsset(username);
            } else if (type === Enums.TransactionType.Vote) {
                if (this.app.config.vote) {
                    transaction.votesAsset([`+${this.app.config.vote}`]);
                } else if (this.app.config.unvote) {
                    transaction.votesAsset([`-${this.app.config.unvote}`]);
                } else {
                    if (senderWallet.vote) {
                        transaction.votesAsset([`-${senderWallet.vote}`]);
                    } else {
                        transaction.votesAsset([`+${senderWallet.publicKey}`]);
                    }
                }
            } else if (type === Enums.TransactionType.MultiSignature && Managers.configManager.getMilestone().aip11) {
                for (const passphrase of this.app.config.multiSignature.asset.participants) {
                    transaction.participant(Identities.PublicKey.fromPassphrase(passphrase));
                }

                transaction.min(this.app.config.multiSignature.asset.min);

                const multiSignatureAddress = Identities.Address.fromMultiSignatureAsset(
                    transaction.data.asset.multiSignature,
                );
                console.log(`Created MultiSignature address: ${multiSignatureAddress}`);
                transaction.senderPublicKey(senderWallet.publicKey);

                const participants = this.app.config.multiSignature.asset.participants;
                for (let i = 0; i < participants.length; i++) {
                    transaction.multiSign(participants[i], i);
                }

                walletChanges.push({
                    transaction: transaction,
                    address: multiSignatureAddress,
                    passphrases: this.app.config.multiSignature.asset.participants,
                    publicKey: Identities.PublicKey.fromMultiSignatureAsset(transaction.data.asset.multiSignature),
                });
            } else if (type === Enums.TransactionType.Ipfs && Managers.configManager.getMilestone().aip11) {
                transaction.ipfsAsset(this.app.config.ipfs);
            } else if (type === Enums.TransactionType.MultiPayment && Managers.configManager.getMilestone().aip11) {
                let payments;
                if (!this.app.config.multiPayments || this.app.config.multiPayments.length === 0) {
                    payments = [];
                    const count = Math.floor(Math.random() * (128 - 64 + 1) + 64);
                    for (let i = 0; i < count; i++) {
                        payments.push({
                            recipientId: this.app.walletRepository.getRandomWallet().address,
                            amount: "1",
                        });
                    }
                } else {
                    payments = this.app.config.multiPayments;
                }

                for (const payment of payments) {
                    transaction.addPayment(payment.recipientId, payment.amount);
                }
            } else if (
                type === Enums.TransactionType.DelegateResignation &&
                Managers.configManager.getMilestone().aip11
            ) {
            } else if (type === Enums.TransactionType.HtlcLock && Managers.configManager.getMilestone().aip11) {
                transaction.recipientId(recipientId);
                transaction.amount(this.app.config.amount);

                if (this.app.config.htlc.lock.expiration.type === Enums.HtlcLockExpirationType.EpochTimestamp) {
                    const networktime = await this.app.client.retrieveNetworktime();
                    if (this.app.config.htlc.lock.expiration.value < networktime) {
                        this.app.config.htlc.lock.expiration.value += networktime;
                    }
                }

                transaction.htlcLockAsset(this.app.config.htlc.lock);
            } else if (type === Enums.TransactionType.HtlcClaim && Managers.configManager.getMilestone().aip11) {
                const claim = this.app.config.htlc.claim;
                const lockTransactionId =
                    claim.lockTransactionId ||
                    (await this.app.client.retrieveTransaction(senderWallet.publicKey, 8))[0].id;

                transaction.htlcClaimAsset({ ...claim, lockTransactionId });
            } else if (type === Enums.TransactionType.HtlcRefund && Managers.configManager.getMilestone().aip11) {
                const refund = this.app.config.htlc.refund;
                const lockTransactionId =
                    refund.lockTransactionId ||
                    (await this.app.client.retrieveTransaction(senderWallet.publicKey, 8))[0].id;

                transaction.htlcRefundAsset({ lockTransactionId });
            } else if (type === 11 && Managers.configManager.getMilestone().aip11) {
                // Entity
                const EntityType = MagistrateCrypto.Enums.EntityType;
                const EntitySubType = MagistrateCrypto.Enums.EntitySubType;
                const mapTypeAndSubtype = {
                    business: { type: EntityType.Business, subType: EntitySubType.None },
                    bridgechain: { type: EntityType.Bridgechain, subType: EntitySubType.None },
                    developer: { type: EntityType.Developer, subType: EntitySubType.None },
                    "plugin-core": { type: EntityType.Plugin, subType: EntitySubType.PluginCore },
                    "plugin-desktop": { type: EntityType.Plugin, subType: EntitySubType.PluginDesktop },
                };
                const mapAction = {
                    register: { action: MagistrateCrypto.Enums.EntityAction.Register },
                    update: { action: MagistrateCrypto.Enums.EntityAction.Update },
                    resign: { action: MagistrateCrypto.Enums.EntityAction.Resign },
                };
                const entityAsset = {
                    ...mapTypeAndSubtype[splitInput[2]],
                    ...mapAction[splitInput[3]],
                    data: {},
                };
                if (entityAsset.action === MagistrateCrypto.Enums.EntityAction.Register) {
                    entityAsset.data.name = splitInput[4];
                    entityAsset.data.ipfsData = splitInput[5];
                } else if (entityAsset.action === MagistrateCrypto.Enums.EntityAction.Update) {
                    entityAsset.registrationId = splitInput[4];
                    entityAsset.data.ipfsData = splitInput[5];
                } else if (entityAsset.action === MagistrateCrypto.Enums.EntityAction.Resign) {
                    entityAsset.registrationId = splitInput[4];
                }
                transaction.asset(entityAsset);
            } else if (type === 20 && Managers.configManager.getMilestone().aip11) {
                // NFTRegisterCollection
                transaction.NFTRegisterCollectionAsset(this.app.config.nft.registerCollection);
            } else if (type === 21 && Managers.configManager.getMilestone().aip11) {
                // NFTCreateToken
                const createAsset = { ...this.app.config.nft.createAsset };
                if (!createAsset.collectionId) {
                    if (!senderWallet.attributes.nft?.base?.collections) {
                        throw new Error("Wallet doesn't have any collections");
                    }
                    createAsset.collectionId = Object.keys(senderWallet.attributes.nft.base.collections)[0];
                }
                transaction.NFTCreateToken(createAsset);
            } else if (type === 22 && Managers.configManager.getMilestone().aip11) {
                // NFTTransferAsset
                const transferAsset = { ...this.app.config.nft.transferAsset };
                if (!transferAsset.nftIds?.length) {
                    if (
                        !senderWallet.attributes.nft?.base?.tokenIds ||
                        !Object.keys(senderWallet.attributes.nft.base.tokenIds).length
                    ) {
                        throw new Error("Wallet doesn't own any assets");
                    }

                    transferAsset.nftIds = [Object.keys(senderWallet.attributes.nft.base.tokenIds)[i]];
                }

                if (!transferAsset.recipientId) {
                    transferAsset.recipientId = recipientId;
                }
                transaction.NFTTransferAsset(transferAsset);
            } else if (type === 23 && Managers.configManager.getMilestone().aip11) {
                // NFTBurnAsset
                const burnAsset = { ...this.app.config.nft.burnAsset };
                if (!burnAsset.nftId) {
                    if (
                        !senderWallet.attributes.nft?.base?.tokenIds ||
                        !Object.keys(senderWallet.attributes.nft.base.tokenIds).length
                    ) {
                        throw new Error("Wallet doesn't own any assets");
                    }

                    burnAsset.nftId = Object.keys(senderWallet.attributes.nft.base.tokenIds)[i];
                }

                transaction.NFTBurnAsset(burnAsset);
            } else if (type === 24 && Managers.configManager.getMilestone().aip11) {
                // NFTAuctionAsset
                const auctionAsset = { ...this.app.config.nft.auctionAsset };
                if (!auctionAsset.nftIds?.length) {
                    if (
                        !senderWallet.attributes.nft?.base?.tokenIds ||
                        !Object.keys(senderWallet.attributes.nft.base.tokenIds).length
                    ) {
                        throw new Error("Wallet doesn't own any assets");
                    }

                    auctionAsset.nftIds = [Object.keys(senderWallet.attributes.nft.base.tokenIds)[i]];
                }

                transaction.NFTAuctionAsset(auctionAsset);
            } else if (type === 25 && Managers.configManager.getMilestone().aip11) {
                // NFTCancelAuctionAsset
                const cancelAuction = { ...this.app.config.nft.cancelAuction };
                if (!cancelAuction.auctionId) {
                    if (
                        !senderWallet.attributes.nft?.exchange?.auctions ||
                        !Object.keys(senderWallet.attributes.nft.exchange.auctions).length
                    ) {
                        throw new Error("Wallet doesn't own any auctions");
                    }

                    cancelAuction.auctionId = Object.keys(senderWallet.attributes.nft.exchange.auctions)[i];
                }

                transaction.NFTAuctionCancelAsset(cancelAuction);
            } else if (type === 26 && Managers.configManager.getMilestone().aip11) {
                // NFTBidAsset
                const bidAsset = { ...this.app.config.nft.bidAsset };
                if (!bidAsset.auctionId) {
                    if (
                        !recipientWallet.attributes.nft?.exchange?.auctions ||
                        !Object.keys(recipientWallet.attributes.nft.exchange.auctions).length
                    ) {
                        throw new Error("Wallet doesn't own any auctions");
                    }

                    bidAsset.auctionId = Object.keys(recipientWallet.attributes.nft.exchange.auctions)[i];
                }

                // set different bid amount for multiple bids
                bidAsset.bidAmount += i;

                transaction.NFTBidAsset(bidAsset);
            } else if (type === 27 && Managers.configManager.getMilestone().aip11) {
                // NFTCancelBidAsset
                const cancelBidAsset = { ...this.app.config.nft.cancelBidAsset };
                if (!cancelBidAsset.bidId) {
                    const bids = await this.app.client.retrieveBidsByPublicKey(senderWallet.publicKey);
                    if (!bids.length) {
                        throw new Error("Wallet doesn't have any bids");
                    }

                    cancelBidAsset.bidId = bids[i].id;
                }

                transaction.NFTBidCancelAsset(cancelBidAsset);
            } else if (type === 28 && Managers.configManager.getMilestone().aip11) {
                // NFTAcceptTradeAsset
                const acceptTradeAsset = { ...this.app.config.nft.acceptTradeAsset };

                if (!acceptTradeAsset.auctionId) {
                    if (
                        !senderWallet.attributes.nft?.exchange?.auctions ||
                        !Object.keys(senderWallet.attributes.nft.exchange.auctions).length
                    ) {
                        throw new Error("Wallet doesn't own any auctions");
                    }

                    acceptTradeAsset.auctionId = Object.keys(senderWallet.attributes.nft.exchange.auctions)[i];
                }

                if (!acceptTradeAsset.bidId) {
                    if (
                        !Object.keys(senderWallet.attributes.nft.exchange.auctions[acceptTradeAsset.auctionId].bids)
                            .length
                    ) {
                        throw new Error("Auction doesn't own any bids");
                    }

                    acceptTradeAsset.bidId =
                        senderWallet.attributes.nft.exchange.auctions[acceptTradeAsset.auctionId].bids[0];
                }

                transaction.NFTAcceptTradeAsset(acceptTradeAsset);
            } else {
                throw new Error("Version 2 not supported.");
            }

            let vendorField = this.app.config.vendorField.value;
            if (!vendorField && this.app.config.vendorField.random && (type === 0 || type === 6 || type === 8)) {
                vendorField = Math.random().toString();
            }

            if (vendorField) {
                transaction.vendorField(vendorField);
            }

            if (senderWallet.signType === WalletSignType.Basic) {
                this.sign(transaction, senderWallet.passphrase);
            }

            if (senderWallet.signType === WalletSignType.SecondSignature) {
                this.sign(transaction, senderWallet.passphrase);
                this.secondSign(transaction, this.app.config.secondPassphrase || "second passphrase");
            }

            if (senderWallet.signType === WalletSignType.MultiSignature) {
                for (const { index, passphrase } of this.app.config.multiSignature.passphrases) {
                    transaction.multiSign(passphrase, index);
                }
            }

            const instance: Interfaces.ITransaction = transaction.build();
            const payload = instance.toJson();

            if (this.app.config.verbose) {
                console.log(`Transaction: ${JSON.stringify(payload, undefined, 4)}`);
            }

            //assert(instance.verify() || senderWallet.signType === WalletSignType.MultiSignature);
            transactions.push(payload);
        }

        return { transactions, walletChanges };
    }

    private async configureCrypto() {
        Managers.configManager.setFromPreset(this.app.config.network);

        try {
            const height = await this.app.client.retrieveHeight();

            Managers.configManager.setHeight(height);
        } catch (ex) {
            console.log("configureCrypto: " + ex.message);
            process.exit();
        }
    }

    private secondSign(builder, passphrase) {
        if (!this.app.config.ecdsa) {
            builder.secondSign(passphrase);
        } else {
            const buffer = Transactions.Utils.toHash(builder.data, {
                excludeSecondSignature: true,
            });

            builder.data.secondSignature = Crypto.Hash.signECDSA(buffer, Identities.Keys.fromPassphrase(passphrase));
        }
    }

    private sign(builder, passphrase) {
        if (!this.app.config.ecdsa) {
            builder.sign(passphrase);
        } else {
            const buffer = Transactions.Utils.toHash(builder.data, {
                excludeSignature: true,
                excludeSecondSignature: true,
            });

            builder.data.signature = Crypto.Hash.signECDSA(buffer, Identities.Keys.fromPassphrase(passphrase));
        }
    }

    private getMultiSignatureAddress() {
        return {
            publicKey: Identities.PublicKey.fromMultiSignatureAsset({
                min: this.app.config.multiSignature.asset.min,
                publicKeys: this.app.config.multiSignature.asset.participants.map((passphrase) =>
                    Identities.PublicKey.fromPassphrase(passphrase),
                ),
            }),
            address: Identities.Address.fromMultiSignatureAsset({
                min: this.app.config.multiSignature.asset.min,
                publicKeys: this.app.config.multiSignature.asset.participants.map((passphrase) =>
                    Identities.PublicKey.fromPassphrase(passphrase),
                ),
            }),
        };
    }
}
