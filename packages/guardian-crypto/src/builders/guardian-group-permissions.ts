import { Utils } from "@arkecosystem/crypto";

import { GuardianTransactionTypes } from "../enums";
import { GuardianGroupPermissionsAsset } from "../interfaces";
import { GuardianGroupPermissionsTransaction } from "../transactions";
import { GuardianBaseTransactionBuilder } from "./guardian-base-builder";

export class GuardianGroupPermissionsBuilder extends GuardianBaseTransactionBuilder<GuardianGroupPermissionsBuilder> {
    public constructor() {
        super();
        this.data.type = GuardianTransactionTypes.GuardianSetGroupPermissions;
        this.data.amount = Utils.BigNumber.ZERO;
        this.data.fee = GuardianGroupPermissionsTransaction.staticFee();
        this.data.asset = { setGroupPermissions: {} };
    }

    public GuardianGroupPermissions(
        setGroupPermissions: GuardianGroupPermissionsAsset,
    ): GuardianGroupPermissionsBuilder {
        if (this.data.asset) {
            this.data.asset.setGroupPermissions = setGroupPermissions;
        }
        return this;
    }

    protected instance(): GuardianGroupPermissionsBuilder {
        return this;
    }
}
