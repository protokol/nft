import { flags } from "@oclif/command";

import { builders } from "../../builders";
import { TransactionType } from "../../enums";
import { SendBase } from "../../shared/send-base";

export default class MultiPayment extends SendBase {
    public static description = SendBase.defaultDescription + builders[TransactionType.MultiPayment].name;
    public static flags = {
        ...SendBase.defaultFlags,
        recipients: flags.string({
            description: "Addresses of recipients",
            default:
                "ANBkoGqWeTSiaEVgVzSKZd3jS7UWzv9PSo," +
                "AbfQq8iRSf9TFQRzQWo33dHYU7HFMS17Zd," +
                "AV6GP5qhhsZG6MHb4gShy22doUnVjEKHcN",
        }),
        amounts: flags.string({
            description: "amount to send to the recipients",
            default: "1,2,3",
        }),
    };

    public type = TransactionType.MultiPayment;

    protected prepareConfig(config, flags) {
        const mergedConfig = { ...config };
        if (flags.recipients && flags.amounts) {
            const multiPayments: any = [];
            const recipients = flags.recipients.split(",");
            const amounts = flags.amounts.split(",");
            for (let i = 0; i < recipients.length; i++) {
                multiPayments.push({ recipientId: recipients[i], amount: amounts[i] });
            }
            mergedConfig.multiPayments = multiPayments;
        }

        return mergedConfig;
    }

    protected getCommand(): any {
        return MultiPayment;
    }
}
