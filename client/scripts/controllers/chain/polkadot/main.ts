import { ChainClass, NodeInfo } from 'models';
import { IApp } from 'state';
import Substrate from '../substrate/main';

class Polkadot extends Substrate {
  constructor(n: NodeInfo, app: IApp) {
    super(n, app, ChainClass.Polkadot);

    this.signaling.disable();
  }
}

export default Polkadot;
