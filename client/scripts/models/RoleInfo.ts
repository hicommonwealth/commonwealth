import { AddressInfo } from '.';
import RolePermission from './RolePermission';

class RoleInfo {
  public readonly id: number;
  public readonly address_id: number;
  public readonly address: string;
  public readonly address_chain: string;
  public readonly chain_id: string;
  public readonly offchain_community_id: string;
  public permission: RolePermission;
  public is_user_default: boolean;

  constructor(id, address_id, address, address_chain, chain_id, offchain_community_id, permission, is_user_default) {
    this.id = id;
    this.address_id = address_id;
    this.address = address;
    this.address_chain = address_chain;
    this.chain_id = chain_id;
    this.offchain_community_id = offchain_community_id;
    this.permission = permission;
    this.is_user_default = is_user_default;
  }
}

export default RoleInfo;
