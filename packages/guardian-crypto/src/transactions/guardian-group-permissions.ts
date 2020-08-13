import { Utils as AppUtils } from "@arkecosystem/core-kernel";
import { Transactions, Utils } from "@arkecosystem/crypto";
import ByteBuffer from "bytebuffer";

import { defaults } from "../defaults";
import { GuardianStaticFees, GuardianTransactionGroup, GuardianTransactionTypes } from "../enums";
import { GuardianGroupPermissionsAsset } from "../interfaces";
import { amountSchema, groupNameSchema, permissionsSchema, vendorFieldSchema } from "./utils/guardian-schemas";
import { calculatePermissionsLength, deserializePermissions, serializePermissions } from "./utils/serde";

const { schemas } = Transactions;

export class GuardianGroupPermissionsTransaction extends Transactions.Transaction {
    public static typeGroup: number = GuardianTransactionGroup;
    public static type = GuardianTransactionTypes.GuardianSetGroupPermissions;
    public static key: string = "GuardianGroupPermissions";
    public static version: number = defaults.version;

    protected static defaultStaticFee = Utils.BigNumber.make(GuardianStaticFees.GuardianSetGroupPermissions);

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
                    required: ["setGroupPermissions"],
                    properties: {
                        setGroupPermissions: {
                            type: "object",
                            required: ["name", "priority", "permissions", "active", "default"],
                            properties: {
                                name: groupNameSchema,
                                priority: { type: "integer" },
                                active: { type: "boolean" },
                                default: { type: "boolean" },
                                permissions: permissionsSchema,
                            },
                        },
                    },
                },
            },
        });
    }

    public serialize(): ByteBuffer {
        const { data } = this;

        AppUtils.assert.defined<GuardianGroupPermissionsAsset>(data.asset?.setGroupPermissions);
        const setGroupPermissionAsset: GuardianGroupPermissionsAsset = data.asset.setGroupPermissions;

        const nameBuffer: Buffer = Buffer.from(setGroupPermissionAsset.name);
        const buffer: ByteBuffer = new ByteBuffer(
            nameBuffer.length +
            32 + // priority
            1 + // active
            1 + // default
                calculatePermissionsLength(setGroupPermissionAsset.permissions),
            true,
        );

        // name
        buffer.writeByte(nameBuffer.length);
        buffer.append(nameBuffer, "hex");

        // priority
        buffer.writeUint32(setGroupPermissionAsset.priority);

        // active
        buffer.writeByte(+setGroupPermissionAsset.active);

        // default
        buffer.writeByte(+setGroupPermissionAsset.default);

        // permissions
        serializePermissions(buffer, setGroupPermissionAsset.permissions);

        return buffer;
    }

    public deserialize(buf): void {
        const { data } = this;

        const nameLength: number = buf.readUint8();
        const name: string = buf.readString(nameLength);
        const priority = buf.readUInt32();
        const active = Boolean(buf.readUint8());
        const isDefault = Boolean(buf.readUint8());

        // permissions
        const permissions = deserializePermissions(buf);

        const setGroupPermissions: GuardianGroupPermissionsAsset = {
            name,
            priority,
            active,
            default: isDefault,
            permissions: permissions!,
        };

        data.asset = {
            setGroupPermissions,
        };
    }

    public hasVendorField(): boolean {
        return true;
    }
}
