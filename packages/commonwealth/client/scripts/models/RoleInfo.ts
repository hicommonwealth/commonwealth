import { AddressInfo } from 'models';
import RolePermission from './RolePermission';

class RoleInfo {
  public readonly id: number;
  public readonly Address?: AddressInfo;
  public readonly address_id: number;
  public readonly address: string;
  public readonly address_chain: string;
  public readonly chain_id: string;
  public permission: RolePermission;
  public allow: bigint;
  public deny: bigint;
  public is_user_default: boolean;

  constructor(
    id: number,
    address_id: number,
    address: string,
    address_chain: string,
    chain_id: string,
    permission: RolePermission,
    allow: bigint,
    deny: bigint,
    is_user_default: boolean
  ) {
    this.id = id;
    this.address_id = address_id;
    this.address = address;
    this.address_chain = address_chain;
    this.chain_id = chain_id;
    this.permission = permission;
    this.allow = allow;
    this.deny = deny;
    this.is_user_default = is_user_default;
  }

  public static fromJSON(json) {
    const {
      id,
      address_id,
      address,
      address_chain,
      chain_id,
      permission,
      allow,
      deny,
      is_user_default
    } = json;

    return new RoleInfo(
      id,
      address_id,
      address,
      address_chain,
      chain_id,
      permission,
      allow,
      deny,
      is_user_default
    );
  }
}

export default RoleInfo;
