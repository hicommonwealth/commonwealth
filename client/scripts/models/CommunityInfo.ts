import $ from 'jquery';
import app from 'state';
import { RoleInfo, RolePermission } from 'models';
import ChainInfo from './ChainInfo';
import OffchainTag from './OffchainTag';

class CommunityInfo {
  public readonly id: string;
  public name: string;
  public description: string;
  public readonly defaultChain: ChainInfo;
  public invitesEnabled: boolean;
  public privacyEnabled: boolean;
  public readonly featuredTags: string[];
  public readonly tags: OffchainTag[];
  public adminsAndMods: RoleInfo[];

  constructor(id, name, description, defaultChain, invitesEnabled, privacyEnabled, featuredTags, tags, adminsAndMods?) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.defaultChain = defaultChain;
    this.invitesEnabled = invitesEnabled;
    this.privacyEnabled = privacyEnabled;
    this.featuredTags = featuredTags || [];
    this.tags = tags || [];
    this.adminsAndMods = adminsAndMods || [];
  }

  public static fromJSON(json) {
    return new CommunityInfo(
      json.id,
      json.name,
      json.description,
      json.default_chain,
      json.invitesEnabled,
      json.privacyEnabled,
      json.featuredTags,
      json.tags,
      json.adminsAndMods,
    );
  }

  public async getAdminsAndMods(id: string) {
    try {
      const res = await $.get(`${app.serverUrl()}/bulkMembers`, { community: id, });
      const roles = res.result.filter((r) => {
        return r.permission === RolePermission.admin || r.permission === RolePermission.moderator;
      });
      this.setAdmins(roles);
    } catch {
      console.log('Failed to fetch admins/mods');
    }
  }

  public setAdmins(roles) {
    this.adminsAndMods = [];
    roles.forEach((r) => {
      this.adminsAndMods.push(new RoleInfo(
        r.id,
        r.address_id,
        r.Address.address,
        r.chain_id,
        r.offchain_community_id,
        r.permission,
        r.is_user_default
      ));
    });
  }

  public async updateCommunityData(
    name: string,
    description: string,
    privacyEnabled: boolean,
    invitesEnabled: boolean
  ) {
    // TODO: Change to PUT /community
    const r = await $.post(`${app.serverUrl()}/updateCommunity`, {
      'id': app.activeCommunityId(),
      'name': name,
      'description': description,
      'privacy': privacyEnabled,
      'invites': invitesEnabled,
      'jwt': app.login.jwt,
    });
    const updatedCommunity: CommunityInfo = r.result;
    this.name = updatedCommunity.name;
    this.description = updatedCommunity.description;
    this.privacyEnabled = updatedCommunity.privacyEnabled;
    this.invitesEnabled = updatedCommunity.invitesEnabled;
  }

  public addFeaturedTag(tag: string) {
    this.featuredTags.push(tag);
  }

  public removeFeaturedTag(tag: string) {
    if (this.featuredTags.includes(tag)) {
      this.featuredTags.splice(this.featuredTags.indexOf(tag), 1);
    }
  }

  public async updateFeaturedTags(tags: string[]) {
    try {
      // TODO: Change to PUT /community
      await $.post(`${app.serverUrl()}/updateCommunity`, {
        'id': app.activeCommunityId(),
        'featured_tags[]': tags,
        'jwt': app.login.jwt
      });
    } catch (err) {
      console.log('Failed to update featured tags');
      throw new Error((err.responseJSON && err.responseJSON.error)
        ? err.responseJSON.error
        : 'Failed to update featured tags');
    }
  }
}

export default CommunityInfo;
