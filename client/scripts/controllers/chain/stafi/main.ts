import { ChainClass, NodeInfo } from 'models';
import { IApp } from 'state';
import StafiSpec from 'adapters/chain/stafi/spec';
import Substrate from '../substrate/main';

class Stafi extends Substrate {
  constructor(n: NodeInfo, app: IApp) {
    super(n, app, ChainClass.Polkadot);

    this.signaling.disable();
  }

  public async initApi() {
    await super.initApi({
      types: StafiSpec,
    });
  }
}

export default Stafi;
