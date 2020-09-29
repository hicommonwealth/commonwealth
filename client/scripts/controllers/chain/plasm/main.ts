import { ChainClass, NodeInfo } from 'models';
import { IApp } from 'state';
import Substrate from '../substrate/main';

class Plasm extends Substrate {
  constructor(n: NodeInfo, app: IApp) {
    super(n, app, ChainClass.Polkadot);
  }

  public async initData() {
    // use old democracy logic
    super.initData(true);
  }
}

export default Plasm;
