import { spec } from '@edgeware/node-types';
import { ChainClass, NodeInfo } from 'models';
import { IApp } from 'state';
import Substrate from '../substrate/main';

class Edgeware extends Substrate {
  constructor(n: NodeInfo, app: IApp) {
    super(n, app, ChainClass.Edgeware);

    this.technicalCommittee.disable();
  }

  public async initApi() {
    await super.initApi(spec);
  }
}

export default Edgeware;
