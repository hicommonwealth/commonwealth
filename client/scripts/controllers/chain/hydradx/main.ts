import { ChainClass, NodeInfo } from 'models';
import { IApp } from 'state';
import Substrate from '../substrate/main';
import SpecTypes from './spec';

class HydraDx extends Substrate {
  constructor(n: NodeInfo, app: IApp) {
    super(n, app, ChainClass.HydraDx);
    this.signaling.disable();
    this.identities.disable();
  }

  public async initApi() {
    await super.initApi({
      'types': SpecTypes,
    });
  }
}

export default HydraDx;