/**
 * This file was auto-generated by Fern from our API Definition.
 */
import * as serializers from "../../../index";
import * as CommonApi from "../../../../api/index";
import * as core from "../../../../core";
export declare const CreateThreadReactionResponseAddressWalletId: core.serialization.Schema<serializers.CreateThreadReactionResponseAddressWalletId.Raw, CommonApi.CreateThreadReactionResponseAddressWalletId>;
export declare namespace CreateThreadReactionResponseAddressWalletId {
    type Raw = "magic" | "polkadot" | "metamask" | "walletconnect" | "keplr-ethereum" | "keplr" | "leap" | "near" | "terrastation" | "terra-walletconnect" | "cosm-metamask" | "phantom" | "coinbase";
}
