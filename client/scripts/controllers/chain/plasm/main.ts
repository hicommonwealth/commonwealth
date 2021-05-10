import { ChainClass, NodeInfo } from 'models';
import { IApp } from 'state';
import SpecTypes from 'adapters/chain/plasm/spec';
import Substrate from '../substrate/main';

class Plasm extends Substrate {
  constructor(n: NodeInfo, app: IApp) {
    super(n, app, ChainClass.Plasm);
  }

  public async initApi() {
    await super.initApi(SpecTypes);
  }
}

export default Plasm;
