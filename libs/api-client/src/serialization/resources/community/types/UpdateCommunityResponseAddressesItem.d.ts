/**
 * This file was auto-generated by Fern from our API Definition.
 */
import * as serializers from "../../../index";
import * as CommonApi from "../../../../api/index";
import * as core from "../../../../core";
import { UpdateCommunityResponseAddressesItemWalletId } from "./UpdateCommunityResponseAddressesItemWalletId";
import { UpdateCommunityResponseAddressesItemRole } from "./UpdateCommunityResponseAddressesItemRole";
import { UpdateCommunityResponseAddressesItemUser } from "./UpdateCommunityResponseAddressesItemUser";
export declare const UpdateCommunityResponseAddressesItem: core.serialization.ObjectSchema<serializers.UpdateCommunityResponseAddressesItem.Raw, CommonApi.UpdateCommunityResponseAddressesItem>;
export declare namespace UpdateCommunityResponseAddressesItem {
    interface Raw {
        id?: number | null;
        address: string;
        community_id: string;
        user_id?: number | null;
        verification_token?: string | null;
        verification_token_expires?: string | null;
        verified?: string | null;
        last_active?: string | null;
        ghost_address?: boolean | null;
        wallet_id?: UpdateCommunityResponseAddressesItemWalletId.Raw | null;
        block_info?: string | null;
        is_user_default?: boolean | null;
        role?: UpdateCommunityResponseAddressesItemRole.Raw | null;
        is_banned?: boolean | null;
        hex?: string | null;
        User?: UpdateCommunityResponseAddressesItemUser.Raw | null;
        created_at?: string | null;
        updated_at?: string | null;
    }
}
