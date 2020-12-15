import { ChainClass, NodeInfo } from 'models';
import { IApp } from 'state';

import Substrate from '../substrate/main';

class Centrifuge extends Substrate {
  constructor(n: NodeInfo, app: IApp) {
    super(n, app, ChainClass.Centrifuge);

    this.signaling.disable();
    this.treasury.disable();
    this.technicalCommittee.disable();
  }

  public async initApi() {
    await super.initApi();
  }
}

export default Centrifuge;
