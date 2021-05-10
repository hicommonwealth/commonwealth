import { ChainClass, NodeInfo } from 'models';
import { IApp } from 'state';
import SpecTypes from 'adapters/chain/darwinia/spec';
import Substrate from '../substrate/main';

class Darwinia extends Substrate {
  constructor(n: NodeInfo, app: IApp) {
    super(n, app, ChainClass.Darwinia);
  }

  public async initApi() {
    await super.initApi({
      'types': SpecTypes,
    });
  }
}

export default Darwinia;
