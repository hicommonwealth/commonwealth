import { ChainClass, NodeInfo } from 'models';
import { IApp } from 'state';
import SpecTypes from 'adapters/chain/kulupu/spec';
import Substrate from '../substrate/main';

class Kulupu extends Substrate {
  constructor(n: NodeInfo, app: IApp) {
    super(n, app, ChainClass.Kulupu);
  }

  public async initApi() {
    await super.initApi(SpecTypes);
  }
}

export default Kulupu;
