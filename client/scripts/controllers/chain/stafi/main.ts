import { ChainClass, NodeInfo } from 'models';
import { IApp } from 'state';
import Substrate from '../substrate/main';

class Stafi extends Substrate {
  constructor(n: NodeInfo, app: IApp) {
    super(n, app, ChainClass.Stafi);
  }
}

export default Stafi;
