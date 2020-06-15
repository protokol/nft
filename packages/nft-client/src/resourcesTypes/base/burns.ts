import { ApiQuery } from "@arkecosystem/client";

export interface Burns {
    id: string;
    senderPublicKey: string;
    nftBurn: {
        nftId: string;
    };
}

export interface AllBurnsQuery extends ApiQuery {
    orderBy?: string;
    transform?: boolean;
}
