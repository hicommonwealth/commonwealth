import IdStore from './IdStore';
import { CommunityInfo } from '../models';

class OffchainCommunitiesStore extends IdStore<CommunityInfo> {
  private _storeCommunity: { [community: string]: CommunityInfo[] } = {};

  public add(c: CommunityInfo) {
    super.add(c);
    if (!this._storeCommunity[c.id]) {
      this._storeCommunity[c.id] = [];
    }
    this._storeCommunity[c.id].push(c);
    return this;
  }

  public remove(c: CommunityInfo) {
    super.remove(c);
    this._storeCommunity[c.id] = this._storeCommunity[c.id].filter((x) => x !== c);
    return this;
  }

  public clear() {
    super.clear();
    this._storeCommunity = {};
  }

  public getByCommunity(communityId: string) {
    return this._storeCommunity[communityId];
  }
}

export default OffchainCommunitiesStore;
