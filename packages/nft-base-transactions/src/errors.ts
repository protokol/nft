import { Errors } from "@arkecosystem/core-transactions";

// NFTRegisterSchema transaction errors
export class NFTBaseJsonSchemaParseError extends Errors.TransactionError {
    public constructor() {
        super(`Failed to apply transaction, because an error occurred while parsing schema object.`);
    }
}

export class NFTBaseInvalidAjvSchemaError extends Errors.TransactionError {
    public constructor() {
        super(`Failed to apply transaction, because of invalid ajv json schema.`);
    }
}

// NFTCreate transaction errors
export class NFTBaseCollectionDoesNotExists extends Errors.TransactionError {
    public constructor() {
        super(`Failed to apply transaction, because NFT schema does not exists.`);
    }
}

export class NFTBaseMaximumSupplyError extends Errors.TransactionError {
    public constructor() {
        super(`Failed to apply transaction, because NFT schema reached maximum supply.`);
    }
}

export class NFTBaseSenderPublicKeyDoesNotExists extends Errors.TransactionError {
    public constructor() {
        super(`Failed to apply transaction, because sender public key is not specified as issuer.`);
    }
}

export class NFTBaseSchemaDoesNotMatch extends Errors.TransactionError {
    public constructor() {
        super(`Failed to apply transaction, because NFT schema does not match.`);
    }
}

// NFTTransfer transaction errors
export class NFTBaseTransferCannotBeApplied extends Errors.TransactionError {
    public constructor() {
        super(`Failed to apply transaction, because wallet does not own any nft token.`);
    }
}

export class NFTBaseTransferWalletDoesntOwnSpecifiedNftToken extends Errors.TransactionError {
    public constructor() {
        super(`Failed to apply transaction, because wallet does not own specified nft token.`);
    }
}

export class NFTBaseTransferNFTIsOnAuction extends Errors.TransactionError {
    public constructor() {
        super(`Failed to apply transaction, because nft is already on auction.`);
    }
}

// NFTBurn transaction errors
export class NFTBaseBurnCannotBeApplied extends Errors.TransactionError {
    public constructor() {
        super(`Failed to apply transaction, because wallet does not own any nft token.`);
    }
}

export class NFTBaseBurnWalletDoesntOwnSpecifiedNftToken extends Errors.TransactionError {
    public constructor() {
        super(`Failed to apply transaction, because wallet does not own specified nft token.`);
    }
}
