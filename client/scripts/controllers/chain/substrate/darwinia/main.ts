import { ChainClass, NodeInfo } from 'models';
import { IApp } from 'state';
import spec from './spec';

import Substrate from '../main';

class Darwinia extends Substrate {
  constructor(n: NodeInfo, app: IApp) {
    super(n, app, ChainClass.Darwinia);
  }

  public async initApi() {
    await super.initApi({
      'types': spec,
    });
  }
}

export default Darwinia;
