import { Errors } from "@arkecosystem/core-transactions";

// NFTAuction errors
export class NFTExchangeAuctionExpired extends Errors.TransactionError {
    public constructor() {
        super(`Failed to apply transaction, because auction expired.`);
    }
}

export class NFTExchangeAuctioneerDoesNotOwnAnyNft extends Errors.TransactionError {
    public constructor() {
        super(`Failed to apply transaction, because wallet does not own any nft.`);
    }
}

export class NFTExchangeAuctioneerDoesNotOwnNft extends Errors.TransactionError {
    public constructor() {
        super(`Failed to apply transaction, because wallet does not own specified nft.`);
    }
}

export class NFTExchangeAuctionAlreadyInProgress extends Errors.TransactionError {
    public constructor() {
        super(`Failed to apply transaction, because auction for wanted nft already in progress.`);
    }
}

// NFTAuctionCancel errors
export class NFTExchangeAuctionCancelCannotCancel extends Errors.TransactionError {
    public constructor() {
        super(`Failed to apply transaction, because wallet doesn't own wanted auction.`);
    }
}

// NFTBid errors
export class NFTExchangeBidAuctionDoesNotExists extends Errors.TransactionError {
    public constructor() {
        super(`Failed to apply transaction, because auction doesn't exists.`);
    }
}

export class NFTExchangeBidAuctionCanceledOrAccepted extends Errors.TransactionError {
    public constructor() {
        super(`Failed to apply transaction, because auction was canceled or accepted.`);
    }
}

export class NFTExchangeBidAuctionExpired extends Errors.TransactionError {
    public constructor() {
        super(`Failed to apply transaction, because auction expired.`);
    }
}

export class NFTExchangeBidNotEnoughFounds extends Errors.TransactionError {
    public constructor() {
        super(`Failed to apply transaction, because wallet doesn't have enough funds.`);
    }
}

export class NFTExchangeBidStartAmountToLow extends Errors.TransactionError {
    public constructor() {
        super(`Failed to apply transaction, because bid amount is to low.`);
    }
}

export class NFTExchangeBidCannotBidOwnItem extends Errors.TransactionError {
    public constructor() {
        super(`Failed to apply transaction, because it is not allowed to bid on own auction.`);
    }
}

// Bid Cancel errors
export class NFTExchangeBidCancelBidDoesNotExists extends Errors.TransactionError {
    public constructor() {
        super(`Failed to apply transaction, because bid does not exists.`);
    }
}

export class NFTExchangeBidCancelAuctionCanceledOrAccepted extends Errors.TransactionError {
    public constructor() {
        super(`Failed to apply transaction, because auction was already accepted or canceled.`);
    }
}

export class NFTExchangeBidCancelBidCanceled extends Errors.TransactionError {
    public constructor() {
        super(`Failed to apply transaction, because bid was already canceled.`);
    }
}

export class NFTExchangeBidCancelCannotCancelOtherBids extends Errors.TransactionError {
    public constructor() {
        super(`Failed to apply transaction, because it is not allowed to cancel other user's bids.`);
    }
}

// Accept trade errors
export class NFTExchangeAcceptTradeWalletCannotTrade extends Errors.TransactionError {
    public constructor() {
        super(`Failed to apply transaction, because it doesn't own nft.exchange property.`);
    }
}

export class NFTExchangeAcceptTradeBidDoesNotExists extends Errors.TransactionError {
    public constructor() {
        super(`Failed to apply transaction, because bid transaction doesn't exists`);
    }
}

export class NFTExchangeAcceptTradeAuctionDoesNotExists extends Errors.TransactionError {
    public constructor() {
        super(`Failed to apply transaction, because auction transaction doesn't exists`);
    }
}

export class NFTExchangeAcceptTradeAuctionCanceled extends Errors.TransactionError {
    public constructor() {
        super(`Failed to apply transaction, because auction was already canceled.`);
    }
}

export class NFTExchangeAcceptTradeBidCanceled extends Errors.TransactionError {
    public constructor() {
        super(`Failed to apply transaction, because bid was already canceled.`);
    }
}

// Fee errors
export class StaticFeeMismatchError extends Errors.TransactionError {
    public constructor(staticFee: string) {
        super(`Failed to apply transaction, because fee doesn't match static fee ${staticFee}.`);
    }
}
