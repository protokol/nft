import { Crypto } from "@arkecosystem/crypto";

export const config = {
    network: "testnet",
    // log sent transaction payload
    verbose: true,
    // defaults to random genesis seed node
    peer: undefined,
    // defaults to schnorr signatures if aip11 milestone is active, otherwise has no effect
    ecdsa: false,
    // defaults to a random passphrase
    passphrase: undefined,
    // disable transaction broadcast
    coldrun: false,
    // defaults to a random recipient
    recipientId: undefined,
    // default is retrieved from API
    startNonce: undefined,
    // default is no expiration, only valid for transfer. expiration is by block height
    expiration: undefined,
    // amount for transfer and htlc lock
    amount: "1",
    // defaults to static fee
    fee: undefined,
    // defaults to a random vendor field or value if set
    vendorField: {
        value: undefined,
        random: true,
    },
    // used to create second signature
    secondPassphrase: undefined,
    // delegate name, defaults to slice of sender public key
    delegateName: undefined,
    // vote/unvote defaults to slice of sender public key ^
    vote: undefined,
    unvote: undefined,
    // multi signature configuration
    multiSignature: {
        // If enabled, all transactions will be made from the multisig wallet that is derived
        // from the configured `asset`
        enabled: false,
        asset: {
            // passphrase of each participant
            participants: ["multisig participant 1", "multisig participant 2", "multisig participant 3"],
            // mandatory signatures
            min: 2,
        },

        // Use the following passphrases to sign a multisignature transaction for the configured `asset`
        // if `enabled` is true:
        passphrases: [
            { index: 0, passphrase: "multisig participant 1" },
            { index: 1, passphrase: "multisig participant 2" },
            { index: 2, passphrase: "multisig participant 3" },
        ],
    },
    // ipfs
    ipfs: "QmYSK2JyM3RyDyB52caZCTKFR3HKniEcMnNJYdk8DQ6KKB",
    // multi payment defaults to 64-128 payments to specific recipients
    multiPayments: [
        // { recipientId: "recipient2", amount: "1"},
        // { recipientId: "recipient1", amount: "1"},
    ],
    htlc: {
        lock: {
            // sha256 of secret
            secretHash: Crypto.HashAlgorithms.sha256(
                Crypto.HashAlgorithms.sha256("htlc secret").toString("hex").slice(0, 32),
            ).toString("hex"),
            expiration: {
                // 1=EpochTimestamp, 2=BlockHeight
                type: 1,
                // expiration in seconds relative to network time (this scripts reads the network time)
                // if height then use absolute height
                value: 52 * 8, // Lock expires after approx. 1 round
            },
        },
        claim: {
            // by default it tries to retrieve the last lock transaction id from given sender via API
            lockTransactionId: undefined,
            // same as used for the htlc lock
            unlockSecret: Crypto.HashAlgorithms.sha256("htlc secret").toString("hex").slice(0, 32),
        },
        refund: {
            // by default it tries to retrieve the last lock transaction id from given sender via API
            lockTransactionId: undefined,
        },
    },
    entity: {
        type: 0,
        subType: 0,
        action: "register",
        data: {
            name: "my_business",
            ipfsData: "QmV1n5F9PuBE2ovW9jVfFpxyvWZxYHjSdfLrYL2nDcb1gW",
        },
        registrationId: "521b65c4f1f08716f9cc70f3a0c4d1ea5899f35a122d238b2114eed8161c0d5f",
    },
    nft: {
        registerCollection: {
            name: "FIFA-20-PLAYERS",
            description: "FIFA 2020 Players",
            maximumSupply: 10,
            jsonSchema: {
                properties: {
                    name: {
                        type: "string",
                    },
                    pac: {
                        type: "number",
                    },
                },
            },
        },
        createAsset: {
            collectionId: "",
            attributes: {
                name: "Tests auction 1",
                pac: 90,
            },
        },
        transferAsset: {
            nftIds: [],
            recipientId: "AW8n3yvSAqUJkyfcG5u3bgRxsNKzXYPamN",
        },
        burnAsset: {
            nftId: "",
        },
        auctionAsset: {
            nftIds: [],
            startAmount: 1,
            expiration: {
                blockHeight: 1000000,
            },
        },
        cancelAuction: {
            auctionId: "",
        },
        bidAsset: { auctionId: "fc23547c034ca442a9d8bcd19b74b309df65c479bb5b0d58d431ddab40bac03d", bidAmount: 1 },
        cancelBidAsset: { bidId: "" },
        acceptTradeAsset: {
            bidId: "",
            auctionId: "",
        },
    },
};
