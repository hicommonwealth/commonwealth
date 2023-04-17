import Near from 'controllers/chain/near/adapter';
import type { IApp } from 'state';
import ChainInfo from '../../../../models/ChainInfo';
import NearSputnikDao from './dao';

export default class NearSputnik extends Near {
  public dao: NearSputnikDao;

  constructor(meta: ChainInfo, app: IApp) {
    super(meta, app);
    this.dao = new NearSputnikDao(app);
  }

  public async initData() {
    await this.dao.init(this.chain, this.accounts);
    await super.initData();
  }

  public async deinit() {
    await this.dao.deinit();
    await super.deinit();
    console.log('Sputnik stopped.');
  }
}
