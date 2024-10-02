/**
 * This file was auto-generated by Fern from our API Definition.
 */
import * as serializers from "../../../index";
import * as CommonApi from "../../../../api/index";
import * as core from "../../../../core";
import { CreateGroupResponseChainNodeBalanceType } from "./CreateGroupResponseChainNodeBalanceType";
import { CreateGroupResponseChainNodeCosmosGovVersion } from "./CreateGroupResponseChainNodeCosmosGovVersion";
import { CreateGroupResponseChainNodeHealth } from "./CreateGroupResponseChainNodeHealth";
import { CreateGroupResponseChainNodeContractsItem } from "./CreateGroupResponseChainNodeContractsItem";
export declare const CreateGroupResponseChainNode: core.serialization.ObjectSchema<serializers.CreateGroupResponseChainNode.Raw, CommonApi.CreateGroupResponseChainNode>;
export declare namespace CreateGroupResponseChainNode {
    interface Raw {
        id?: number | null;
        url?: string | null;
        eth_chain_id?: number | null;
        alt_wallet_url?: string | null;
        private_url?: string | null;
        balance_type?: CreateGroupResponseChainNodeBalanceType.Raw | null;
        name?: string | null;
        description?: string | null;
        ss58?: number | null;
        bech32?: string | null;
        slip44?: number | null;
        cosmos_chain_id?: string | null;
        cosmos_gov_version?: CreateGroupResponseChainNodeCosmosGovVersion.Raw | null;
        health?: CreateGroupResponseChainNodeHealth.Raw | null;
        contracts?: CreateGroupResponseChainNodeContractsItem.Raw[] | null;
        block_explorer?: string | null;
        max_ce_block_range?: number | null;
        created_at?: string | null;
        updated_at?: string | null;
    }
}
