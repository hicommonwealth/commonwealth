import $ from 'jquery';
import app from 'state';
import ChainInfo from './ChainInfo';
import OffchainTag from './OffchainTag';

class CommunityInfo {
  public readonly id: string;
  public readonly name: string;
  public readonly description: string;
  public readonly defaultChain: ChainInfo;
  public readonly invitesEnabled: boolean;
  public readonly privacyEnabled: boolean;
  public readonly featuredTags: string[];
  public readonly tags: OffchainTag[];

  constructor(id, name, description, defaultChain, invitesEnabled, privacyEnabled, featuredTags, tags) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.defaultChain = defaultChain;
    this.invitesEnabled = invitesEnabled;
    this.privacyEnabled = privacyEnabled;
    this.featuredTags = featuredTags || [];
    this.tags = tags || [];
  }

  public static fromJSON(json) {
    return new CommunityInfo(
      json.id,
      json.name,
      json.description,
      json.default_chain,
      json.invitesEnabled,
      json.privacyEnabled,
      json.featured_tags,
      json.tags
    );
  }
  public async updateCommunityData(name: string, description: string,) {
    try {
      await $.post(`${app.serverUrl()}/updateCommunity`, {
        'id': app.activeCommunityId(),
        'name': name,
        'description': description,
        'jwt': app.login.jwt,
      });
    } catch (err) {
      console.log('Failed to update featured tags');
      throw new Error((err.responseJSON && err.responseJSON.error)
        ? err.responseJSON.error
        : 'Failed to update featured tags');
    }
  }

  public async updateFeaturedTags(tags: string[]) {
    try {
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
