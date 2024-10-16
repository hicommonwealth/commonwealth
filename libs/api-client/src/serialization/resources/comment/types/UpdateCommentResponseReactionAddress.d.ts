/**
 * This file was auto-generated by Fern from our API Definition.
 */
import * as CommonApi from '../../../../api/index';
import * as core from '../../../../core';
import * as serializers from '../../../index';
import { UpdateCommentResponseReactionAddressRole } from './UpdateCommentResponseReactionAddressRole';
import { UpdateCommentResponseReactionAddressUser } from './UpdateCommentResponseReactionAddressUser';
import { UpdateCommentResponseReactionAddressWalletId } from './UpdateCommentResponseReactionAddressWalletId';
export declare const UpdateCommentResponseReactionAddress: core.serialization.ObjectSchema<
  serializers.UpdateCommentResponseReactionAddress.Raw,
  CommonApi.UpdateCommentResponseReactionAddress
>;
export declare namespace UpdateCommentResponseReactionAddress {
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
    wallet_id?: UpdateCommentResponseReactionAddressWalletId.Raw | null;
    block_info?: string | null;
    is_user_default?: boolean | null;
    role?: UpdateCommentResponseReactionAddressRole.Raw | null;
    is_banned?: boolean | null;
    hex?: string | null;
    User?: UpdateCommentResponseReactionAddressUser.Raw | null;
    created_at?: string | null;
    updated_at?: string | null;
  }
}
