import { Errors } from "@arkecosystem/core-transactions";

// NFTRegisterSchema transaction errors
export class NFTBaseInvalidAjvSchemaError extends Errors.TransactionError {
    public constructor() {
        super(`Failed to apply transaction, because of invalid ajv json schema.`);
    }
}

export class NFTBaseUnauthorizedCollectionRegistrator extends Errors.TransactionError {
    public constructor() {
        super(`Failed to apply transaction, because sender public key is not authorized to register a collection.`);
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

export class NFTBaseBurnWalletDoesntOwnSpecifiedToken extends Errors.TransactionError {
    public constructor() {
        super(`Failed to apply transaction, because wallet does not own specified nft token.`);
    }
}

export class NFTBaseBurnNFTIsOnAuction extends Errors.TransactionError {
    public constructor() {
        super(`Failed to apply transaction, because nft is already on auction.`);
    }
}

// Fee errors
export class StaticFeeMismatchError extends Errors.TransactionError {
    public constructor(staticFee: string) {
        super(`Failed to apply transaction, because fee doesn't match static fee ${staticFee}.`);
    }
}
