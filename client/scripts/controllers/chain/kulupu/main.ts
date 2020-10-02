import { ChainClass, NodeInfo } from 'models';
import { IApp } from 'state';
import Substrate from '../substrate/main';

class Kulupu extends Substrate {
  constructor(n: NodeInfo, app: IApp) {
    super(n, app, ChainClass.Polkadot);
  }

  public async initData() {
    super.initData();
  }
}

export default Kulupu;
