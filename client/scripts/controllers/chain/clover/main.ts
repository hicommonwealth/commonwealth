import { ChainClass, NodeInfo } from 'models';
import { IApp } from 'state';
import SpecTypes from 'adapters/chain/clover/spec';
import Substrate from '../substrate/main';

class Clover extends Substrate {
  constructor(n: NodeInfo, app: IApp) {
    super(n, app, ChainClass.Clover);
  }

  public async initApi() {
    await super.initApi(SpecTypes);
  }
}

export default Clover;
