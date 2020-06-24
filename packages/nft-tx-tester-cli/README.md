# Core Tx Tester

<p align="center">
    <img src="https://github.com/ArkEcosystem/core-tx-tester/blob/master/banner.png?raw=true" />
</p>

> A simple command line utility to create and broadcast transactions.

[![License: MIT](https://badgen.now.sh/badge/license/MIT/green)](https://opensource.org/licenses/MIT)

## Installation

-   `git clone https://github.com/ArkEcosystem/core-tx-tester.git`
-   `cd core-tx-tester`
-   `npm install`

## Usage

### General

The script provides 100 test wallets with `450 DARK` each. You can find them at the
bottom of the script. By default it will use these wallets when creating and signing transactions. Don't spend all at once!

### Basic

Run `node index.js` and enter a type number.

### Advanced

The script contains many self-explanatory options to tweak it's behavior. Open it with an editor (e.g. `nano index.js`), make modifications and run `node index.js` again.

```ts
const config = {
    // log sent transaction payload
    verbose: true,
    // defaults to random genesis seed node
    peer: undefined,
    // defaults to schnorr signatures
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
    // multi payment defaults to 128-256 payments to specific recipients
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
    business: {
        registration: {
            name: `Devnet ${Math.random()}`,
            website: "dexplorer.ark.io",
            vat: undefined, // NOTE: will be renamed soon
            repository: undefined,
        },
        update: {
            name: `Devnet ${Math.random()}`,
            website: "dexplorer.ark.io",
            vat: undefined, // NOTE: will be renamed soon
            repository: undefined,
        },
    },
    bridgechain: {
        registration: {
            name: `Bridgechain ${Math.random()}`,
            seedNodes: ["1.1.1.1", "1.2.3.4"],
            genesisHash: Crypto.HashAlgorithms.sha256("my genesis hash").toString("hex"),
            // default is empty
            bridgechainRepository: "https://github.com/ArkEcosystem/core",
        },
        update: {
            // Each registration generates a unique id,
            // inspect wallet to get the bridgechainId or trust
            // this script to lookup the correct one for you.
            bridgechainId: undefined,
            // by defaults creates random seeds to replace the existing ones.
            seedNodes: [],
        },
        resignation: {
            // Each registration generates a unique id,
            // inspect wallet to get the bridgechainId or trust
            // this script to lookup the correct one for you.
            bridgechainId: undefined,
        },
    },
};
```

## Credits

This project exists thanks to all the people who [contribute](../../contributors).

## License

[MIT](LICENSE) © [ARK Ecosystem](https://ark.io)
