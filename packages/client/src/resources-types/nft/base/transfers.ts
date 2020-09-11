import { ApiQuery } from "@arkecosystem/client";

import { Timestamp } from "../../timestamp";

export interface Transfers {
    id: string;
    senderPublicKey: string;
    nftTransfer: {
        nftIds: string[];
        recipientId: string;
    };
    timestamp: Timestamp;
}

export interface AllTransfersQuery extends ApiQuery {
    orderBy?: string;
    transform?: boolean;
}
