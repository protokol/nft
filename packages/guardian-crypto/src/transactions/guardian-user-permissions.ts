import { Transactions, Utils } from "@arkecosystem/crypto";
import { Asserts } from "@protokol/utils";
import ByteBuffer from "bytebuffer";

import { defaults } from "../defaults";
import { GuardianStaticFees, GuardianTransactionGroup, GuardianTransactionTypes } from "../enums";
import { IGuardianUserPermissionsAsset } from "../interfaces";
import { amountSchema, groupNameSchema, permissionsSchema, vendorFieldSchema } from "./utils/guardian-schemas";
import { calculatePermissionsLength, deserializePermissions, serializePermissions } from "./utils/serde";

const { schemas } = Transactions;

export class GuardianUserPermissionsTransaction extends Transactions.Transaction {
    public static typeGroup: number = GuardianTransactionGroup;
    public static type = GuardianTransactionTypes.GuardianSetUserPermissions;
    public static key = "GuardianUserPermissions";
    public static version: number = defaults.version;

    protected static defaultStaticFee = Utils.BigNumber.make(GuardianStaticFees.GuardianSetUserPermissions);

    public static getSchema(): Transactions.schemas.TransactionSchema {
        return schemas.extend(schemas.transactionBaseSchema, {
            $id: this.key,
            required: ["asset", "typeGroup"],
            properties: {
                type: { transactionType: this.type },
                typeGroup: { const: this.typeGroup },
                amount: amountSchema,
                vendorField: vendorFieldSchema,
                asset: {
                    type: "object",
                    required: ["setUserPermissions"],
                    properties: {
                        setUserPermissions: {
                            type: "object",
                            required: ["publicKey"],
                            properties: {
                                publicKey: {
                                    $ref: "publicKey",
                                },
                                groupNames: {
                                    type: "array",
                                    uniqueItems: true,
                                    items: groupNameSchema,
                                },
                                allow: permissionsSchema,
                                deny: permissionsSchema,
                            },
                        },
                    },
                },
            },
        });
    }

    public serialize(): ByteBuffer {
        const { data } = this;

        Asserts.assert.defined<IGuardianUserPermissionsAsset>(data.asset?.setUserPermissions);
        const setUserPermissionAsset: IGuardianUserPermissionsAsset = data.asset.setUserPermissions;

        const groupNamesBuffer: Buffer[] = [];
        let groupNamesLength = 1;
        if (setUserPermissionAsset.groupNames) {
            for (const groupName of setUserPermissionAsset.groupNames) {
                const groupNameBuffer = Buffer.from(groupName);
                groupNamesBuffer.push(groupNameBuffer);
                groupNamesLength += 1 + groupNameBuffer.length;
            }
        }

        const buffer: ByteBuffer = new ByteBuffer(
            66 + // privateKey
                groupNamesLength +
                calculatePermissionsLength(setUserPermissionAsset.allow) +
                calculatePermissionsLength(setUserPermissionAsset.deny),
            true,
        );

        // publicKey
        buffer.append(Buffer.from(setUserPermissionAsset.publicKey), "hex");

        // groupNames
        buffer.writeByte(groupNamesBuffer.length);
        for (const groupNameBuffer of groupNamesBuffer) {
            buffer.writeByte(groupNameBuffer.length);
            buffer.append(groupNameBuffer, "hex");
        }

        // allow permissions
        serializePermissions(buffer, setUserPermissionAsset.allow);

        // deny permissions
        serializePermissions(buffer, setUserPermissionAsset.deny);

        return buffer;
    }

    public deserialize(buf): void {
        const { data } = this;

        const publicKey = buf.readString(66);

        const setUserPermissions: IGuardianUserPermissionsAsset = {
            publicKey,
        };

        // groupNames
        const numOfGroupNames = buf.readUint8();
        if (numOfGroupNames) {
            setUserPermissions.groupNames = [];
            for (let i = 0; i < numOfGroupNames; i++) {
                const groupNameLength: number = buf.readUint8();
                setUserPermissions.groupNames.push(buf.readString(groupNameLength));
            }
        }

        // allow permissions
        const allow = deserializePermissions(buf);
        if (allow) {
            setUserPermissions.allow = allow;
        }

        // deny permissions
        const deny = deserializePermissions(buf);
        if (deny) {
            setUserPermissions.deny = deny;
        }

        data.asset = {
            setUserPermissions,
        };
    }

    public hasVendorField(): boolean {
        return true;
    }
}
