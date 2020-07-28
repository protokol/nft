import { ApiQuery } from "@arkecosystem/client";

export interface Burns {
    id: string;
    senderPublicKey: string;
    nftBurn: {
        nftId: string;
    };
}

export interface BurnsTimestamp extends Burns{
    timestamp: {
        epoch: number;
        unix: number;
        human: string;
    };
}

export interface AllBurnsQuery extends ApiQuery {
    orderBy?: string;
    transform?: boolean;
}
