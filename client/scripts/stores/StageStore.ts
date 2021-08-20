import IdStore from './IdStore';
import { OffchainStage } from '../models';
import { byAscendingCreationDate } from '../helpers';

// TODO: Differentiate between stages associated with a chain, and stages associated with a community
class StageStore extends IdStore<OffchainStage> {
  private _stagesByCommunity: { [identifier: string]: Array<OffchainStage> } = {};

  public add(stage: OffchainStage) {
    // TODO: Remove this once we start enforcing an ordering in stores
    super.add(stage);
    this.getAll().sort(byAscendingCreationDate);
    const parentEntity = stage.communityId ? stage.communityId : stage.chainId;
    if (!this._stagesByCommunity[parentEntity]) {
      this._stagesByCommunity[parentEntity] = [];
    }
    this._stagesByCommunity[parentEntity].push(stage);
    this._stagesByCommunity[parentEntity].sort(byAscendingCreationDate);
    return this;
  }

  public remove(stage: OffchainStage) {
    super.remove(stage);
    const parentEntity = stage.communityId ? stage.communityId : stage.chainId;
    const communityStore = this._stagesByCommunity[parentEntity];
    const matchingStage = communityStore.filter((t) => t.id === stage.id)[0];
    const proposalIndex = communityStore.indexOf(matchingStage);
    if (proposalIndex === -1) {
      throw new Error('Stage not in proposals store');
    }
    communityStore.splice(proposalIndex, 1);
    return this;
  }

  public clear() {
    super.clear();
    this._stagesByCommunity = {};
  }

  public getByCommunity(communityId): Array<OffchainStage> {
    return this._stagesByCommunity[communityId] || [];
  }

  public getByName(name, communityId): OffchainStage {
    return this.getByCommunity(communityId).find((t) => t.name === name);
  }
}

export default StageStore;
