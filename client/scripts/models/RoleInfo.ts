import RolePermission from './RolePermission';

class RoleInfo {
  public readonly id: number;
  public readonly address_id: number;
  public readonly chain_id: string;
  public readonly offchain_community_id: string;
  public readonly permission: RolePermission;

  constructor(id, address_id, chain_id, offchain_community_id, permission) {
    this.id = id;
    this.address_id = address_id;
    this.chain_id = chain_id;
    this.offchain_community_id = offchain_community_id;
    this.permission = permission;
  }
}

export default RoleInfo;
