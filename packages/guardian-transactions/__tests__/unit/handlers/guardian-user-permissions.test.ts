import "jest-extended";

import { Application, Container, Contracts, Providers } from "@arkecosystem/core-kernel";
import { Identifiers } from "@arkecosystem/core-kernel/src/ioc";
import { Wallets } from "@arkecosystem/core-state";
import passphrases from "@arkecosystem/core-test-framework/src/internal/passphrases.json";
import { TransactionHandler } from "@arkecosystem/core-transactions/src/handlers";
import { TransactionHandlerRegistry } from "@arkecosystem/core-transactions/src/handlers/handler-registry";
import { Interfaces, Transactions } from "@arkecosystem/crypto";
import { Builders, Enums, Interfaces as GuardianInterfaces } from "@protokol/guardian-crypto";

import { buildWallet, initApp, transactionHistoryService } from "../__support__/app";
import { PermissionKind } from "../../../../guardian-crypto/src/enums";
import { UserInToManyGroupsError } from "../../../src/errors";
import { GuardianApplicationEvents } from "../../../src/events";
import { IUserPermissions } from "../../../src/interfaces";
import { GuardianIndexers } from "../../../src/wallet-indexes";
import { deregisterTransactions } from "../utils/utils";

let app: Application;

let senderWallet: Contracts.State.Wallet;

let walletRepository: Contracts.State.WalletRepository;

let transactionHandlerRegistry: TransactionHandlerRegistry;

let handler: TransactionHandler;

let actual: Interfaces.ITransaction;

const publicKey = "02def27da9336e7fbf63131b8d7e5c9f45b296235db035f1f4242c507398f0f21d";
const userPermissions: IUserPermissions = {
    groups: ["group name"],
    permissions: [{ types: [{ transactionType: 9000, transactionTypeGroup: 0 }], kind: PermissionKind.Allow }],
};

const buildUserPermissionsAsset = (
    publicKey,
    groups,
    permissions,
): GuardianInterfaces.GuardianUserPermissionsAsset => ({ groupNames: groups, publicKey, permissions });

beforeEach(() => {
    app = initApp();

    senderWallet = buildWallet(app, passphrases[0]);

    walletRepository = app.get<Wallets.WalletRepository>(Identifiers.WalletRepository);

    transactionHandlerRegistry = app.get<TransactionHandlerRegistry>(Identifiers.TransactionHandlerRegistry);

    handler = transactionHandlerRegistry.getRegisteredHandlerByType(
        Transactions.InternalTransactionType.from(
            Enums.GuardianTransactionTypes.GuardianSetUserPermissions,
            Enums.GuardianTransactionGroup,
        ),
        2,
    );
    walletRepository.index(senderWallet);

    actual = new Builders.GuardianUserPermissionsBuilder()
        .GuardianUserPermissions(
            buildUserPermissionsAsset(publicKey, userPermissions.groups, userPermissions.permissions),
        )
        .nonce("1")
        .sign(passphrases[0])
        .build();
});

afterEach(() => {
    deregisterTransactions();
});

describe("Guardian set user permissions tests", () => {
    describe("bootstrap tests", () => {
        it("should test bootstrap method", async () => {
            transactionHistoryService.streamByCriteria.mockImplementationOnce(async function* () {
                yield actual.data;
            });

            const userWallet = buildWallet(app, passphrases[1]);
            walletRepository.index(userWallet);

            await expect(handler.bootstrap()).toResolve();

            expect(
                userWallet.getAttribute<GuardianInterfaces.GuardianUserPermissionsAsset>("guardian.userPermissions"),
            ).toStrictEqual(userPermissions);

            expect(
                walletRepository.findByIndex(
                    GuardianIndexers.UserPermissionsIndexer,
                    actual.data.asset!.setUserPermissions.publicKey,
                ),
            ).toStrictEqual(userWallet);
        });
    });

    describe("throwIfCannotBeApplied tests", () => {
        it("should not throw", async () => {
            await expect(handler.throwIfCannotBeApplied(actual, senderWallet)).toResolve();
        });

        it("should throw if setUserPermissions is undefined", async () => {
            const undefinedTokenInTransaction = { ...actual };
            undefinedTokenInTransaction.data.asset = undefined;

            await expect(handler.throwIfCannotBeApplied(undefinedTokenInTransaction, senderWallet)).toReject();
        });

        it("should prevent to set user permissions if user belongs in too many groups", async () => {
            app.get<Providers.PluginConfiguration>(Container.Identifiers.PluginConfiguration).set(
                "maxDefinedGroupsPerUser",
                0,
            );

            await expect(handler.throwIfCannotBeApplied(actual, senderWallet)).rejects.toThrowError(
                UserInToManyGroupsError,
            );
        });
    });

    describe("emitEvents", () => {
        it("should test dispatch", async () => {
            const emitter: Contracts.Kernel.EventDispatcher = app.get<Contracts.Kernel.EventDispatcher>(
                Identifiers.EventDispatcherService,
            );

            const spy = jest.spyOn(emitter, "dispatch");

            handler.emitEvents(actual, emitter);

            expect(spy).toHaveBeenCalledWith(GuardianApplicationEvents.SetUserPermissions, expect.anything());
        });
    });
    //
    // describe("apply tests", () => {
    //     it("should test apply method", async () => {
    //         await expect(handler.apply(actual)).toResolve();
    //
    //         // @ts-ignore
    //         collectionWalletCheck(senderWallet, actual.id, 0, nftCollectionAsset);
    //
    //         // @ts-ignore
    //         expect(walletRepository.findByIndex(NFTIndexers.CollectionIndexer, actual.id)).toStrictEqual(senderWallet);
    //     });
    // });
    //
    // describe("revert tests", () => {
    //     it("should test revert method", async () => {
    //         await handler.apply(actual);
    //
    //         await expect(handler.revert(actual)).toResolve();
    //
    //         // @ts-ignore
    //         expect(senderWallet.getAttribute("nft.base.collections")[actual.id]).toBeUndefined();
    //         // @ts-ignore
    //         expect(walletRepository.getIndex(NFTIndexers.CollectionIndexer).get(actual.id)).toBeUndefined();
    //     });
    // });
});
