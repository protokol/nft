import ByteBuffer from "bytebuffer";

import { IPermission } from "../../interfaces";

export const calculatePermissionsLength = (permissions: IPermission[] | undefined): number => {
    let permissionsLength = 1;
    if (permissions) {
        for (const permission of permissions) {
            permissionsLength += 2 + permission.types.length * 8;
        }
    }

    return permissionsLength;
};

export const serializePermissions = (buffer: ByteBuffer, permissions: IPermission[] | undefined) => {
    if (permissions) {
        buffer.writeByte(permissions.length);
        for (const permission of permissions) {
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
};

export const deserializePermissions = (buf: ByteBuffer): IPermission[] | undefined => {
    const numOfPermissions = buf.readUint8();
    if (!numOfPermissions) return;

    const permissions: IPermission[] = [];
    for (let i = 0; i < numOfPermissions; i++) {
        const kind = buf.readUint8();
        const numOfTypes = buf.readUint8();
        const types: IPermission["types"] = [];
        for (let j = 0; j < numOfTypes; j++) {
            const transactionType = buf.readUInt32();
            const transactionTypeGroup = buf.readUInt32();
            types.push({ transactionType, transactionTypeGroup });
        }
        permissions.push({ kind, types });
    }

    return permissions;
};
