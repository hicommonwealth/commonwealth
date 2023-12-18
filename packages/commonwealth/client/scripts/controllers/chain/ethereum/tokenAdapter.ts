import Ethereum from 'controllers/chain/ethereum/adapter';
import type { IApp } from 'state';
import type ChainInfo from '../../../models/ChainInfo';

export default class Token extends Ethereum {
  // Extensions of Ethereum
  constructor(meta: ChainInfo, app: IApp) {
    super(meta, app);
  }

  public async initApi() {
    await this.chain.initMetadata();
    await this.accounts.init(this.chain);
    this._apiInitialized = true;
  }

  public async initData() {
    await super.initData();
  }
}
