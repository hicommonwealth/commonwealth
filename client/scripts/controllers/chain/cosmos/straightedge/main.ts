import { ChainClass, NodeInfo } from 'models';
import { IApp } from 'state';
import Cosmos from '../main';

class Straightedge extends Cosmos {
  constructor(meta: NodeInfo, app: IApp) {
    super(meta, app, ChainClass.Straightedge, 'str');
  }
}

export default Straightedge;
