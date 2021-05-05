import { ChainClass, NodeInfo } from 'models';
import { IApp } from 'state';
import Cosmos from '../main';

class Injective extends Cosmos {
  constructor(meta: NodeInfo, app: IApp) {
    super(meta, app, ChainClass.Injective, 'inj');
  }
}

export default Injective;
