import $ from 'jquery';
import app from 'state';
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
      json.featuredTags,
      json.tags
    );
  }

  public async updateCommunityData(
    name: string,
    description: string,
    privacyEnabled: boolean,
    invitesEnabled: boolean
  ) {
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
      console.dir(`before: ${this.featuredTags.length}`);
      console.dir(this.featuredTags);
      this.featuredTags.splice(this.featuredTags.indexOf(tag), 1);
      console.dir(`after: ${this.featuredTags.length}`);
      console.dir(this.featuredTags);
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
