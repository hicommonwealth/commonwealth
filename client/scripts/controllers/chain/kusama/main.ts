import { ChainClass, NodeInfo } from 'models';
import { IApp } from 'state';
import Substrate from '../substrate/main';

class Kusama extends Substrate {
  constructor(n: NodeInfo, app: IApp) {
    super(n, app, ChainClass.Kusama);

    this.signaling.disable();
  }
}

export default Kusama;
