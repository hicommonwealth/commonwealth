import ChainInfo from './ChainInfo';
import OffchainTag from './OffchainTag';

class CommunityInfo {
  public readonly id: string;
  public readonly name: string;
  public readonly description: string;
  public readonly defaultChain: ChainInfo;
  public readonly invitesEnabled: boolean;
  public readonly privacyEnabled: boolean;
  public readonly tags?: OffchainTag[];

  constructor(id, name, description, defaultChain, invitesEnabled, privacyEnabled, tags?) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.defaultChain = defaultChain;
    this.invitesEnabled = invitesEnabled;
    this.privacyEnabled = privacyEnabled;
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
      json.tags
    );
  }
}

export default CommunityInfo;
