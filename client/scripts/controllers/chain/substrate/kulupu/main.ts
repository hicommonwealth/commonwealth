import { ChainClass, NodeInfo } from 'models';
import { IApp } from 'state';
import Substrate from '../main';

class Kulupu extends Substrate {
  constructor(n: NodeInfo, app: IApp) {
    super(n, app, ChainClass.Kulupu);
  }
}

export default Kulupu;
