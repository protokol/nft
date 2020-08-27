import { Interfaces, Utils } from "@arkecosystem/crypto";
import { Builders } from "@protokol/nft-exchange-crypto";

import { buildTransaction } from "./builder";

export const buildAuction = async (payloadData: {
	nftIds: string[];
	startAmount: number;
	expiration: {
		blockHeight: number;
	};
	nonce?: number;
	passphrase: string;
}): Promise<Interfaces.ITransactionData> => {
	const nftAuctionBuilder = new Builders.NFTAuctionBuilder().NFTAuctionAsset({
		nftIds: payloadData.nftIds,
		startAmount: Utils.BigNumber.make(payloadData.startAmount),
		expiration: { blockHeight: payloadData.expiration.blockHeight },
	});

	return buildTransaction(nftAuctionBuilder, payloadData);
};

export const buildAuctionCancel = async (payloadData: {
	auctionId: string;
	nonce?: number;
	passphrase: string;
}): Promise<Interfaces.ITransactionData> => {
	const nftAuctionCancelBuilder = new Builders.NFTAuctionCancelBuilder().NFTAuctionCancelAsset({
		auctionId: payloadData.auctionId,
	});

	return buildTransaction(nftAuctionCancelBuilder, payloadData);
};

export const buildBid = async (payloadData: {
	auctionId: string;
	bidAmount: number;
	nonce?: number;
	passphrase: string;
}): Promise<Interfaces.ITransactionData> => {
	const nftBidBuilder = new Builders.NFTBidBuilder().NFTBidAsset({
		auctionId: payloadData.auctionId,
		bidAmount: Utils.BigNumber.make(payloadData.bidAmount),
	});

	return buildTransaction(nftBidBuilder, payloadData);
};

export const buildBidCancel = async (payloadData: {
	bidId: string;
	nonce?: number;
	passphrase: string;
}): Promise<Interfaces.ITransactionData> => {
	const nftBidCancelBuilder = new Builders.NFTBidCancelBuilder().NFTBidCancelAsset({
		bidId: payloadData.bidId,
	});

	return buildTransaction(nftBidCancelBuilder, payloadData);
};

export const buildAcceptTrade = async (payloadData: {
	bidId: string;
	auctionId: string;
	nonce?: number;
	passphrase: string;
}): Promise<Interfaces.ITransactionData> => {
	const nftAcceptTradeBuilder = new Builders.NftAcceptTradeBuilder().NFTAcceptTradeAsset({
		auctionId: payloadData.auctionId,
		bidId: payloadData.bidId,
	});

	return buildTransaction(nftAcceptTradeBuilder, payloadData);
};
