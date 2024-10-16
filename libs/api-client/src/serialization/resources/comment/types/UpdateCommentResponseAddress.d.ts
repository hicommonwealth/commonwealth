/**
 * This file was auto-generated by Fern from our API Definition.
 */
import * as CommonApi from '../../../../api/index';
import * as core from '../../../../core';
import * as serializers from '../../../index';
import { UpdateCommentResponseAddressRole } from './UpdateCommentResponseAddressRole';
import { UpdateCommentResponseAddressUser } from './UpdateCommentResponseAddressUser';
import { UpdateCommentResponseAddressWalletId } from './UpdateCommentResponseAddressWalletId';

export declare const UpdateCommentResponseAddress: core.serialization.ObjectSchema<
  serializers.UpdateCommentResponseAddress.Raw,
  CommonApi.UpdateCommentResponseAddress
>;
export declare namespace UpdateCommentResponseAddress {
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
    wallet_id?: UpdateCommentResponseAddressWalletId.Raw | null;
    block_info?: string | null;
    is_user_default?: boolean | null;
    role?: UpdateCommentResponseAddressRole.Raw | null;
    is_banned?: boolean | null;
    hex?: string | null;
    User?: UpdateCommentResponseAddressUser.Raw | null;
    created_at?: string | null;
    updated_at?: string | null;
  }
}
