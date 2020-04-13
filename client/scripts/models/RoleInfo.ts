import RolePermission from './RolePermission';

class RoleInfo {
  public readonly id: number;
  public readonly addressId: number;
  public readonly chainId: string;
  public readonly communityId: string;
  public readonly permission: RolePermission;

  constructor(id, addressId, chainId, communityId, permission) {
    this.id = id;
    this.addressId = addressId;
    this.chainId = chainId;
    this.communityId = communityId;
    this.permission = permission;
  }
}

export default RoleInfo;
