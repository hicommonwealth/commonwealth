import { ChainClass, NodeInfo } from 'models';
import { IApp } from 'state';
import Substrate from '../substrate/main';
import SpecTypes from './spec';

class HydraDX extends Substrate {
  constructor(n: NodeInfo, app: IApp) {
    super(n, app, ChainClass.HydraDX);
    this.signaling.disable();
    this.identities.disable();
    this.democracy.disable();
    this.democracyProposals.disable();
    this.technicalCommittee.disable();
  }

  public async initApi() {
    await super.initApi({
      'types': SpecTypes,
    });
  }
}

export default HydraDX;