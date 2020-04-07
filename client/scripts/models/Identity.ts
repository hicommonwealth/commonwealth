import { Coin } from 'shared/adapters/currency';
import { IIdentifiable } from 'shared/adapters/shared';
import Account from './Account';

abstract class Identity<C extends Coin> implements IIdentifiable {
  public readonly account: Account<C>;
  public readonly identifier: string;
  public readonly username: string;
  constructor(account: Account<C>, identifier: string, username: string) {
    this.account = account;
    this.identifier = identifier;
    this.username = username;
  }
}

export default Identity;
