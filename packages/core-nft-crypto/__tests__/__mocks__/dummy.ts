import { Utils } from "@arkecosystem/crypto";
import ByteBuffer from "bytebuffer";

import { AbstractNFTTransaction, AbstractNFTTransactionBuilder } from "../../src";

export class DummyNFTTrx extends AbstractNFTTransaction {
	static override type = 1;
	static override typeGroup = 10000;
	static override version = 2;
	static override key = "Dummy";

	static override defaultStaticFee = Utils.BigNumber.make(200000);

	public static override getAssetSchema(): Record<string, any> {
		return {};
	}

	public serialize(): ByteBuffer {
		return new ByteBuffer(0);
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars,@typescript-eslint/no-empty-function
	public deserialize(buf: ByteBuffer): void {
		const { data } = this;
		data.asset = {};
	}
}

export class DummyNFTBuilder extends AbstractNFTTransactionBuilder<DummyNFTBuilder> {
	public constructor() {
		super();
		this.data.version = DummyNFTTrx.version;
		this.data.typeGroup = DummyNFTTrx.typeGroup;
		this.data.type = DummyNFTTrx.type;
		this.data.amount = Utils.BigNumber.ZERO;
		this.data.fee = DummyNFTTrx.staticFee();
		this.data.asset = {};
	}

	protected instance(): DummyNFTBuilder {
		return this;
	}
}

export class DummyNFTTrx2 extends AbstractNFTTransaction {
	static override type = 2;
	static override typeGroup = 10000;
	static override version = 2;
	static override key = "Dummy2";

	static override defaultStaticFee = Utils.BigNumber.make(200000);

	public serialize(): ByteBuffer {
		return new ByteBuffer(0);
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars,@typescript-eslint/no-empty-function
	public deserialize(buf: ByteBuffer): void {
		const { data } = this;
		data.asset = {};
	}
}

export class DummyNFTBuilder2 extends AbstractNFTTransactionBuilder<DummyNFTBuilder2> {
	public constructor() {
		super();
		this.data.version = DummyNFTTrx2.version;
		this.data.typeGroup = DummyNFTTrx2.typeGroup;
		this.data.type = DummyNFTTrx2.type;
		this.data.amount = Utils.BigNumber.ZERO;
		this.data.fee = DummyNFTTrx2.staticFee();
		this.data.asset = {};
	}

	protected instance(): DummyNFTBuilder2 {
		return this;
	}
}
