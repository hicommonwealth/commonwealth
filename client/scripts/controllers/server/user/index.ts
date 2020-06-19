import Roles from './roles';

export default class extends Roles {
  /*
    Address logic
  */
  public getDefaultAddressInCommunity(options: { chain?: string, community?: string }) {
    const role = this.roles.find((r) => {
      const communityMatches = options.chain
        ? r.chain_id === options.chain
        : r.offchain_community_id === options.community;
      return communityMatches && r.is_user_default;
    });

    if (!role) return;
    return this.addresses.find((a) => a.id === role.address_id);
  }
}
