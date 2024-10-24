/**
 * This file was auto-generated by Fern from our API Definition.
 */
import * as CommonApi from '../../../../api/index';
import * as core from '../../../../core';
import * as serializers from '../../../index';
import { UpdateThreadResponseAddressRole } from './UpdateThreadResponseAddressRole';
import { UpdateThreadResponseAddressUser } from './UpdateThreadResponseAddressUser';
import { UpdateThreadResponseAddressWalletId } from './UpdateThreadResponseAddressWalletId';
export declare const UpdateThreadResponseAddress: core.serialization.ObjectSchema<
  serializers.UpdateThreadResponseAddress.Raw,
  CommonApi.UpdateThreadResponseAddress
>;
export declare namespace UpdateThreadResponseAddress {
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
    wallet_id?: UpdateThreadResponseAddressWalletId.Raw | null;
    block_info?: string | null;
    is_user_default?: boolean | null;
    role?: UpdateThreadResponseAddressRole.Raw | null;
    is_banned?: boolean | null;
    hex?: string | null;
    User?: UpdateThreadResponseAddressUser.Raw | null;
    created_at?: string | null;
    updated_at?: string | null;
  }
}
