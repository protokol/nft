import ByteBuffer from "bytebuffer";

import { IPermission } from "../../interfaces";

export const calculatePermissionsLength = (permissions: IPermission[] | undefined): number => {
    let permissionsLength = 1;
    if (permissions) {
        permissionsLength += permissions.length * 8;
    }

    return permissionsLength;
};

export const serializePermissions = (buffer: ByteBuffer, permissions: IPermission[] | undefined) => {
    if (permissions) {
        buffer.writeByte(permissions.length);
        for (const permission of permissions) {
            buffer.writeUint32(permission.transactionType);
            buffer.writeUint32(permission.transactionTypeGroup);
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
        const transactionType = buf.readUInt32();
        const transactionTypeGroup = buf.readUInt32();
        permissions.push({ transactionType, transactionTypeGroup });
    }

    return permissions;
};
