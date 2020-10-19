import { WalletSignType } from "../enums";

export interface WalletChange {
	transaction: any;
	address: string;
	publicKey: string;
	secondPassphrase?: string;
	passphrases?: string[];
}

export interface Wallet {
	signType: WalletSignType;
	passphrase?: string;
	secondPassphrase?: string;
	passphrases?: string[];
	address: string;
	publicKey: string;
}

export interface ExtendedWallet extends Wallet {
	secondPublicKey?: string;
	nonce: any;
	vote: any;
	attributes: any;
}
