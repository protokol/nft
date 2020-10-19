export interface BaseConfigurations {
	package: {
		name: string;
		currentVersion: string;
		latestVersion: string;
	};
	crypto: {
		defaults: {
			nftBaseTypeGroup: number;
			nftCollectionName: {
				minLength: number;
				maxLength: number;
			};
			nftCollectionDescription: {
				minLength: number;
				maxLength: number;
			};
			nftCollectionAllowedIssuers: {
				minItems: number;
				maxItems: number;
			};
			nftTransfer: {
				minItems: number;
				maxItems: number;
			};
			nftCollectionJsonSchemaByteSize: number;
			nftTokenAttributesByteSize: number;
		};
	};
	transactions: {
		defaults: {
			authorizedRegistrators: string[];
		};
	};
}
