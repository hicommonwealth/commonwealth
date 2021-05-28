import { ChainClass, NodeInfo } from 'models';
import { IApp } from 'state';
import KylinSpec from 'adapters/chain/kylin/spec';
import Substrate from '../substrate/main';

class Kylin extends Substrate {
  constructor(n: NodeInfo, app: IApp) {
    super(n, app, ChainClass.Kylin);
  }

  public async initApi() {
    await super.initApi(KylinSpec);
  }
}

export default Kylin;
