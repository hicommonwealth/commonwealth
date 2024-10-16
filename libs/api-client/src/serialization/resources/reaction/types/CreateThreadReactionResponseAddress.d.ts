/**
 * This file was auto-generated by Fern from our API Definition.
 */
import * as CommonApi from '../../../../api/index';
import * as core from '../../../../core';
import * as serializers from '../../../index';
import { CreateThreadReactionResponseAddressRole } from './CreateThreadReactionResponseAddressRole';
import { CreateThreadReactionResponseAddressUser } from './CreateThreadReactionResponseAddressUser';
import { CreateThreadReactionResponseAddressWalletId } from './CreateThreadReactionResponseAddressWalletId';
export declare const CreateThreadReactionResponseAddress: core.serialization.ObjectSchema<
  serializers.CreateThreadReactionResponseAddress.Raw,
  CommonApi.CreateThreadReactionResponseAddress
>;
export declare namespace CreateThreadReactionResponseAddress {
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
    wallet_id?: CreateThreadReactionResponseAddressWalletId.Raw | null;
    block_info?: string | null;
    is_user_default?: boolean | null;
    role?: CreateThreadReactionResponseAddressRole.Raw | null;
    is_banned?: boolean | null;
    hex?: string | null;
    User?: CreateThreadReactionResponseAddressUser.Raw | null;
    created_at?: string | null;
    updated_at?: string | null;
  }
}
