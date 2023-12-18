import Solana from './adapter';

export default class Token extends Solana {
  public async initData() {
    await super.initData();
  }
}
