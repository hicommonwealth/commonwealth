/**
 * This file was auto-generated by Fern from our API Definition.
 */
import * as serializers from "../../../index";
import * as CommonApi from "../../../../api/index";
import * as core from "../../../../core";
import { CreateCommentResponseAddressWalletId } from "./CreateCommentResponseAddressWalletId";
import { CreateCommentResponseAddressRole } from "./CreateCommentResponseAddressRole";
import { CreateCommentResponseAddressUser } from "./CreateCommentResponseAddressUser";
export declare const CreateCommentResponseAddress: core.serialization.ObjectSchema<serializers.CreateCommentResponseAddress.Raw, CommonApi.CreateCommentResponseAddress>;
export declare namespace CreateCommentResponseAddress {
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
        wallet_id?: CreateCommentResponseAddressWalletId.Raw | null;
        block_info?: string | null;
        is_user_default?: boolean | null;
        role?: CreateCommentResponseAddressRole.Raw | null;
        is_banned?: boolean | null;
        hex?: string | null;
        User?: CreateCommentResponseAddressUser.Raw | null;
        created_at?: string | null;
        updated_at?: string | null;
    }
}
