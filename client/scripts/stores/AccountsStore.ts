import { Coin } from 'shared/adapters/currency';
import { Account } from '../models';
import Store from './Store';

class AccountsStore<C extends Coin, T extends Account<C>> extends Store<T> {
  private _storeAddress: { [address: string]: T } = {};

  public add(account: T) {
    super.add(account);
    this._storeAddress[account.address] = account;
    return this;
  }

  public remove(account: T) {
    super.remove(account);
    delete this._storeAddress[account.address];
    return this;
  }

  public clear() {
    this._storeAddress = {};
  }

  public getByAddress(address: string): T {
    if (this._storeAddress[address] === undefined) {
      throw new Error(`Invalid user: ${address}`);
    }
    return this._storeAddress[address];
  }
}

export default AccountsStore;
