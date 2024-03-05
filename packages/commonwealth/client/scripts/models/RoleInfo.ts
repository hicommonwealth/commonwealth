import type { AccessLevel } from '@hicommonwealth/core';
import type momentType from 'moment';
import moment from 'moment';
import type AddressInfo from './AddressInfo';

export type RoleInfoData = {
  id: number;
  address_id: number;
  address: string;
  address_chain: string;
  community_id: string;
  permission: AccessLevel;
  allow: number;
  deny: number;
  is_user_default: boolean;
  last_active?: string;
  Address?: AddressInfo;
};

class RoleInfo {
  public readonly id: number;
  public readonly Address?: AddressInfo;
  public readonly address_id: number;
  public readonly address: string;
  public readonly address_chain: string;
  public readonly community_id: string;
  public permission: AccessLevel;
  public allow: number;
  public deny: number;
  public is_user_default: boolean;
  public lastActive?: momentType.Moment;

  constructor({
    id,
    address_id,
    address,
    address_chain,
    community_id,
    permission,
    allow,
    deny,
    is_user_default,
    last_active,
    Address,
  }: RoleInfoData) {
    this.id = id;
    this.address_id = address_id;
    this.address = address;
    this.address_chain = address_chain;
    this.community_id = community_id;
    this.permission = permission;
    this.allow = allow;
    this.deny = deny;
    this.is_user_default = is_user_default;
    this.lastActive = last_active ? moment(last_active) : null;
    this.Address = Address;
  }
}

export default RoleInfo;
