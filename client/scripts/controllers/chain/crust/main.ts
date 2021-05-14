import { ChainClass, NodeInfo } from 'models';
import { IApp } from 'state';
import CrustSpec from 'adapters/chain/crust/spec';
import Substrate from '../substrate/main';

class Crust extends Substrate {
  constructor(n: NodeInfo, app: IApp) {
    super(n, app, ChainClass.Crust);
  }

  public async initApi() {
    await super.initApi({ 'types': { ...CrustSpec } });
  }
}

export default Crust;
