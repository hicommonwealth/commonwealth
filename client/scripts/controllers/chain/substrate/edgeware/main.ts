import { spec } from '@edgeware/node-types';
import { ChainClass, NodeInfo } from 'models';
import { IApp } from 'state';
import Substrate from '../main';

class Edgeware extends Substrate {
  constructor(n: NodeInfo, app: IApp) {
    super(n, app, ChainClass.Edgeware);
  }

  public async initApi() {
    await super.initApi(spec);
  }
}

export default Edgeware;
