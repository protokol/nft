import { ApiQuery } from "@arkecosystem/client";

import { Timestamp } from "../../timestamp";

export interface Burns {
    id: string;
    senderPublicKey: string;
    nftBurn: {
        nftId: string;
    };
    timestamp: Timestamp;
}

export interface AllBurnsQuery extends ApiQuery {
    orderBy?: string;
    transform?: boolean;
}
