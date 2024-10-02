/**
 * This file was auto-generated by Fern from our API Definition.
 */
import * as serializers from "../../../index";
import * as CommonApi from "../../../../api/index";
import * as core from "../../../../core";
import { GetCommunityResponseAddressesBase } from "./GetCommunityResponseAddressesBase";
import { GetCommunityResponseAddressesType } from "./GetCommunityResponseAddressesType";
import { GetCommunityResponseAddressesSocialLinksItem } from "./GetCommunityResponseAddressesSocialLinksItem";
import { GetCommunityResponseAddressesDefaultPage } from "./GetCommunityResponseAddressesDefaultPage";
import { GetCommunityResponseAddressesHasHomepage } from "./GetCommunityResponseAddressesHasHomepage";
import { GetCommunityResponseAddressesTerms } from "./GetCommunityResponseAddressesTerms";
import { GetCommunityResponseAddressesAddressesItem } from "./GetCommunityResponseAddressesAddressesItem";
import { GetCommunityResponseAddressesCommunityStakesItem } from "./GetCommunityResponseAddressesCommunityStakesItem";
import { GetCommunityResponseAddressesCommunityTagsItem } from "./GetCommunityResponseAddressesCommunityTagsItem";
import { GetCommunityResponseAddressesChainNode } from "./GetCommunityResponseAddressesChainNode";
import { GetCommunityResponseAddressesTopicsItem } from "./GetCommunityResponseAddressesTopicsItem";
import { GetCommunityResponseAddressesGroupsItem } from "./GetCommunityResponseAddressesGroupsItem";
import { GetCommunityResponseAddressesContestManagersItem } from "./GetCommunityResponseAddressesContestManagersItem";
import { GetCommunityResponseAddressesAdminsAndModsItem } from "./GetCommunityResponseAddressesAdminsAndModsItem";
export declare const GetCommunityResponseAddresses: core.serialization.ObjectSchema<serializers.GetCommunityResponseAddresses.Raw, CommonApi.GetCommunityResponseAddresses>;
export declare namespace GetCommunityResponseAddresses {
    interface Raw {
        id: string;
        name: string;
        chain_node_id?: number | null;
        default_symbol?: string | null;
        network?: string | null;
        base: GetCommunityResponseAddressesBase.Raw;
        icon_url?: string | null;
        active: boolean;
        type?: GetCommunityResponseAddressesType.Raw | null;
        description?: string | null;
        social_links?: GetCommunityResponseAddressesSocialLinksItem.Raw[] | null;
        ss58_prefix?: number | null;
        stages_enabled?: boolean | null;
        custom_stages?: string[] | null;
        custom_domain?: string | null;
        block_explorer_ids?: string | null;
        collapsed_on_homepage?: boolean | null;
        default_summary_view?: boolean | null;
        default_page?: GetCommunityResponseAddressesDefaultPage.Raw | null;
        has_homepage?: GetCommunityResponseAddressesHasHomepage.Raw | null;
        terms?: GetCommunityResponseAddressesTerms.Raw | null;
        admin_only_polling?: boolean | null;
        bech32_prefix?: string | null;
        hide_projects?: boolean | null;
        token_name?: string | null;
        ce_verbose?: boolean | null;
        discord_config_id?: number | null;
        category?: unknown | null;
        discord_bot_webhooks_enabled?: boolean | null;
        directory_page_enabled?: boolean | null;
        directory_page_chain_node_id?: number | null;
        namespace?: string | null;
        namespace_address?: string | null;
        redirect?: string | null;
        snapshot_spaces?: string[] | null;
        include_in_digest_email?: boolean | null;
        profile_count?: number | null;
        lifetime_thread_count?: number | null;
        banner_text?: string | null;
        created_at?: string | null;
        updated_at?: string | null;
        Addresses?: GetCommunityResponseAddressesAddressesItem.Raw[] | null;
        CommunityStakes?: GetCommunityResponseAddressesCommunityStakesItem.Raw[] | null;
        CommunityTags?: GetCommunityResponseAddressesCommunityTagsItem.Raw[] | null;
        ChainNode?: GetCommunityResponseAddressesChainNode.Raw | null;
        topics?: GetCommunityResponseAddressesTopicsItem.Raw[] | null;
        groups?: GetCommunityResponseAddressesGroupsItem.Raw[] | null;
        contest_managers?: GetCommunityResponseAddressesContestManagersItem.Raw[] | null;
        numVotingThreads: number;
        adminsAndMods: GetCommunityResponseAddressesAdminsAndModsItem.Raw[];
        communityBanner?: string | null;
    }
}
