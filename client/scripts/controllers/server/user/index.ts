import Roles from './roles';

export default class extends Roles {
  /*
    Address logic
  */
  public getDefaultAddressInCommunity(options: { community_id?: string, community?: string }) {
    const role = this.roles.find((r) => {
      const communityMatches = r.community_id === options.community_id
      return communityMatches && r.is_user_default;
    });

    if (!role) return;
    return this.addresses.find((a) => a.id === role.address_id);
  }
}
