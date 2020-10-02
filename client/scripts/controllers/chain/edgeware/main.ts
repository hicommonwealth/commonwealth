import { Mainnet, Beresheet } from '@edgeware/node-types';
import { ChainClass, NodeInfo } from 'models';
import { IApp } from 'state';
import Substrate, { SubstrateModule } from '../substrate/main';

class Edgeware extends Substrate {
  constructor(n: NodeInfo, app: IApp) {
    super(n, app, ChainClass.Edgeware, [ SubstrateModule.TechnicalCommittee ]);
  }

  public async initApi() {
    await super.initApi({
      'types': this.meta.chain.id.includes('testnet') ? Beresheet.types : Mainnet.types,
      'typesAlias': this.meta.chain.id.includes('testnet') ? Beresheet.typesAlias : Mainnet.typesAlias,
    });
  }
}

export default Edgeware;
