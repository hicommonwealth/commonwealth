import type { AccessLevel } from 'permissions';

class RoleInfo {
  public readonly id: number;
  public readonly Address?: AddressInfo;
  public readonly address_id: number;
  public readonly address: string;
  public readonly address_chain: string;
  public readonly chain_id: string;
  public permission: AccessLevel;
  public allow: bigint;
  public deny: bigint;
  public is_user_default: boolean;

  constructor(
    id: number,
    address_id: number,
    address: string,
    address_chain: string,
    chain_id: string,
    permission: AccessLevel,
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
}

export default RoleInfo;
