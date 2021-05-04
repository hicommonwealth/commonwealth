import { ChainClass, NodeInfo } from 'models';
import { IApp } from 'state';
import SpecTypes from 'adapters/chain/hydradx/spec';
import Substrate from '../main';

class HydraDX extends Substrate {
  constructor(n: NodeInfo, app: IApp) {
    super(n, app, ChainClass.HydraDX);
  }

  public async initApi() {
    await super.initApi({
      'types': SpecTypes,
    });
  }
}

export default HydraDX;
