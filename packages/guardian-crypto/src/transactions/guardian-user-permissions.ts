import { Utils as AppUtils } from "@arkecosystem/core-kernel";
import { Transactions, Utils } from "@arkecosystem/crypto";
import ByteBuffer from "bytebuffer";

import { defaults } from "../defaults";
import { GuardianStaticFees, GuardianTransactionGroup, GuardianTransactionTypes } from "../enums";
import { GuardianUserPermissionsAsset, IPermission } from "../interfaces";

const { schemas } = Transactions;

export class GuardianUserPermissionsTransaction extends Transactions.Transaction {
    public static typeGroup: number = GuardianTransactionGroup;
    public static type = GuardianTransactionTypes.GuardianSetUserPermissions;
    public static key: string = "GuardianUserPermissions";
    public static version: number = defaults.version;

    protected static defaultStaticFee = Utils.BigNumber.make(GuardianStaticFees.GuardianSetUserPermissions);

    public static getSchema(): Transactions.schemas.TransactionSchema {
        return schemas.extend(schemas.transactionBaseSchema, {
            $id: this.key,
            required: ["asset", "typeGroup"],
            properties: {
                type: { transactionType: this.type },
                typeGroup: { const: this.typeGroup },
                amount: { bignumber: { minimum: 0, maximum: 0 } },
                vendorField: { anyOf: [{ type: "null" }, { type: "string", format: "vendorField" }] },
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
                                    items: {
                                        type: "string",
                                        minLength: defaults.guardianUserPermissionsGroupName.minLength,
                                        maxLength: defaults.guardianUserPermissionsGroupName.maxLength,
                                    },
                                },
                                permissions: {
                                    type: "array",
                                    items: {
                                        type: "object",
                                        required: ["types", "kind"],
                                        properties: {
                                            kind: {
                                                oneOf: [{ const: 0 }, { const: 1 }],
                                            },
                                            types: {
                                                type: "array",
                                                items: {
                                                    type: "object",
                                                    required: ["transactionType", "transactionTypeGroup"],
                                                    properties: {
                                                        transactionType: { type: "integer", minimum: 0 },
                                                        transactionTypeGroup: { type: "integer", minimum: 0 },
                                                    },
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });
    }

    public serialize(): ByteBuffer {
        const { data } = this;

        AppUtils.assert.defined<GuardianUserPermissionsAsset>(data.asset?.setUserPermissions);
        const setUserPermissionAsset: GuardianUserPermissionsAsset = data.asset.setUserPermissions;

        const groupNamesBuffer: Buffer[] = [];
        let groupNamesLength = 1;
        if (setUserPermissionAsset.groupNames) {
            for (const groupName of setUserPermissionAsset.groupNames) {
                const groupNameBuffer = Buffer.from(groupName);
                groupNamesBuffer.push(groupNameBuffer);
                groupNamesLength += 1 + groupNameBuffer.length;
            }
        }

        let permissionsLength = 1;
        if (setUserPermissionAsset.permissions) {
            for (const permission of setUserPermissionAsset.permissions) {
                permissionsLength += 2 + permission.types.length * 8;
            }
        }

        const buffer: ByteBuffer = new ByteBuffer(66 /*privateKey*/ + groupNamesLength + permissionsLength, true);

        // publicKey
        buffer.append(Buffer.from(setUserPermissionAsset.publicKey), "hex");

        // groupNames
        buffer.writeByte(groupNamesBuffer.length);
        for (const groupNameBuffer of groupNamesBuffer) {
            buffer.writeByte(groupNameBuffer.length);
            buffer.append(groupNameBuffer, "hex");
        }

        // permissions
        if (setUserPermissionAsset.permissions) {
            buffer.writeByte(setUserPermissionAsset.permissions.length);
            for (const permission of setUserPermissionAsset.permissions) {
                buffer.writeByte(permission.kind);
                buffer.writeByte(permission.types.length);
                for (const type of permission.types) {
                    buffer.writeUint32(type.transactionType);
                    buffer.writeUint32(type.transactionTypeGroup);
                }
            }
        } else {
            buffer.writeByte(0);
        }

        return buffer;
    }

    public deserialize(buf): void {
        const { data } = this;

        const publicKey = buf.readString(66);

        const setUserPermissions: GuardianUserPermissionsAsset = {
            publicKey,
        };

        const numOfGroupNames = buf.readUint8();
        if (numOfGroupNames) {
            setUserPermissions.groupNames = [];
            for (let i = 0; i < numOfGroupNames; i++) {
                const groupNameLength: number = buf.readUint8();
                setUserPermissions.groupNames.push(buf.readString(groupNameLength));
            }
        }

        const numOfPermissions = buf.readUint8();
        if (numOfPermissions) {
            setUserPermissions.permissions = [];
            for (let i = 0; i < numOfPermissions; i++) {
                const kind = buf.readUint8();
                const numOfTypes = buf.readUint8();
                const types: IPermission["types"] = [];
                for (let j = 0; j < numOfTypes; j++) {
                    const transactionType = buf.readUInt32();
                    const transactionTypeGroup = buf.readUInt32();
                    types.push({ transactionType, transactionTypeGroup });
                }
                setUserPermissions.permissions.push({ kind, types });
            }
        }

        data.asset = {
            setUserPermissions,
        };
    }

    public hasVendorField(): boolean {
        return true;
    }
}
