import { ApiQuery } from "@arkecosystem/client";

export interface Transfers {
    id: string;
    senderPublicKey: string;
    nftTransfer: {
        nftIds: string[];
        recipientId: string;
    };
}

export interface AllTransfersQuery extends ApiQuery {
    orderBy?: string;
    transform?: boolean;
}
