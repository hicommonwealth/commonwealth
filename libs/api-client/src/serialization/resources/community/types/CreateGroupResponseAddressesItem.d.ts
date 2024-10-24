/**
 * This file was auto-generated by Fern from our API Definition.
 */
import * as CommonApi from '../../../../api/index';
import * as core from '../../../../core';
import * as serializers from '../../../index';
import { CreateGroupResponseAddressesItemRole } from './CreateGroupResponseAddressesItemRole';
import { CreateGroupResponseAddressesItemUser } from './CreateGroupResponseAddressesItemUser';
import { CreateGroupResponseAddressesItemWalletId } from './CreateGroupResponseAddressesItemWalletId';
export declare const CreateGroupResponseAddressesItem: core.serialization.ObjectSchema<
  serializers.CreateGroupResponseAddressesItem.Raw,
  CommonApi.CreateGroupResponseAddressesItem
>;
export declare namespace CreateGroupResponseAddressesItem {
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
    wallet_id?: CreateGroupResponseAddressesItemWalletId.Raw | null;
    block_info?: string | null;
    is_user_default?: boolean | null;
    role?: CreateGroupResponseAddressesItemRole.Raw | null;
    is_banned?: boolean | null;
    hex?: string | null;
    User?: CreateGroupResponseAddressesItemUser.Raw | null;
    created_at?: string | null;
    updated_at?: string | null;
  }
}
