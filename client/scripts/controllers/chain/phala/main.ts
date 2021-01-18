import { ChainClass, NodeInfo } from 'models';
import { IApp } from 'state';

import Substrate from '../substrate/main';

class Phala extends Substrate {
  constructor(n: NodeInfo, app: IApp) {
    super(n, app, ChainClass.Phala);

    this.signaling.disable();
  }

  public async initApi() {
    await super.initApi();
  }
}

export default Phala;
