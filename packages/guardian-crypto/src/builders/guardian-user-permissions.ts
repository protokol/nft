import { Utils } from "@arkecosystem/crypto";

import { GuardianTransactionTypes } from "../enums";
import { IGuardianUserPermissionsAsset } from "../interfaces";
import { GuardianUserPermissionsTransaction } from "../transactions/guardian-user-permissions";
import { GuardianBaseTransactionBuilder } from "./guardian-base-builder";

export class GuardianUserPermissionsBuilder extends GuardianBaseTransactionBuilder<GuardianUserPermissionsBuilder> {
    public constructor() {
        super();
        this.data.type = GuardianTransactionTypes.GuardianSetUserPermissions;
        this.data.amount = Utils.BigNumber.ZERO;
        this.data.fee = GuardianUserPermissionsTransaction.staticFee();
        this.data.asset = { setUserPermissions: {} };
    }

    public GuardianUserPermissions(setUserPermissions: IGuardianUserPermissionsAsset): GuardianUserPermissionsBuilder {
        if (this.data.asset) {
            this.data.asset.setUserPermissions = setUserPermissions;
        }
        return this;
    }

    protected instance(): GuardianUserPermissionsBuilder {
        return this;
    }
}
