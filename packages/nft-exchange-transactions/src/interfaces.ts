export type INFTAuctions = Record<string, INFTAuction>;

export interface INFTAuction {
    nftIds: string[];
    bids: string[];
}
