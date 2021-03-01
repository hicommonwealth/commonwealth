import { ChainClass, NodeInfo } from 'models';
import { IApp } from 'state';
import Substrate from '../substrate/main';
import spec from './spec';

class Clover extends Substrate {
  constructor(n: NodeInfo, app: IApp) {
    super(n, app, ChainClass.Clover);
    this.signaling.disable();
    this.identities.disable();
  }

  public async initApi() {
    await super.initApi({
      'types': spec,
    });
  }
}

export default Clover;
