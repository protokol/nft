import * as cliActions from "./actions";
import { Client } from "./client";
import { config } from "./config/config";
import { Filesystem } from "./filesystem";
import { Prompt } from "./prompt";
import { App } from "./types";
import { WalletRepository } from "./wallets-repository";

/**
 * $ node index.js
 * Ѧ 0      ENTER - send a transfer
 * Ѧ 0 10   ENTER - send 10 transfers
 *
 * CTRL-C to exit.
 * Use config below to tweak script and make it deterministic.
 *
 * TIPS:
 *
 * Once V2 milestone is active:
 * If you get nonce errors, try restarting the script first. It caches the
 * nonces and always increments for each sent transaction even if it ends up getting rejected.
 *
 * - At the bottom of this file are `testWallets` each with a balance of 475 DARK.
 * - If you encounter an error, just CTRL-C and restart.

 * Types:
 * 0 - Transfer
 * 1 - SecondSignature
 * 2 - DelegateRegistration
 * 3 - Vote
 * 4 - MultiSignature
 * 5 - IPFS
 * 6 - MultiPayment
 * 7 - DelegateResignation
 * 8 - HTLC Lock
 * 9 - HTLC Claim
 * 10 - HTLC Refund
 *
 * (These types are actually wrong and only used in this script to keep things simple)
 * 11 - BusinessRegistration
 * 12 - BusinessResignation
 * 13 - BusinessUpdate
 * 14 - BridgechainRegistration
 * 15 - BridgechainResignation
 * 16 - BridgechainUpdate
 *
 * Multisignature:
 * - First register a new multisig wallet (address is derived from the asset `participants` and `min`)
 * - The script will print the new multisig wallet address
 * - After creation send funds to this wallet, set `recipientId` in this script
 * - Finally, `enable` the multisignature by setting it to `true` in the config, do not change the asset at this point
 *   since it is used to derive the address
 * - All outgoing transactions will now be multi signed with the configured `passphrases`
 * - Remove passphrases and change indexes to test `min` etc.
 */

const main = async () => {
    const filesystem = new Filesystem();

    // @ts-ignore
    const app: App = {
        config: config,
        client: new Client(),
        walletRepository: new WalletRepository(await filesystem.loadWallets(config.network)),
        filesystem: filesystem,
        nonces: {},
    };

    app.prompt = new Prompt(app);

    await app.prompt.prompt(selectActionQuestion(), resolveAction);
};

const actions = [cliActions.sendTransaction, cliActions.listWallets, cliActions.saveWallets];

const selectActionQuestion = () => {
    let question = "\nSelect action: ";

    let count = 0;
    for (const action of actions) {
        question += `\n [${count++}] - ${action.description}`;
    }

    question += "\n";

    return question;
};

const resolveAction = async (app: App, data: any) => {
    try {
        let [actionNumber] = data.split(" ");

        actionNumber = +actionNumber;
        const action = actions[actionNumber];

        await action.handler(app, data);
    } catch (ex) {
        console.log(ex.message);
    } finally {
        await app.prompt.prompt(selectActionQuestion(), resolveAction);
    }
};

main();
