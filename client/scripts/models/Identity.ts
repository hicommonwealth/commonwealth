import { Coin } from 'adapters/currency';
import Account from './Account';
import { IHasId } from '../stores';

abstract class Identity<C extends Coin> implements IHasId {
  public readonly account: Account<C>;
  public readonly id: string;
  public username: string;
  constructor(account: Account<C>, identifier: string, username?: string) {
    this.account = account;
    this.id = identifier;
    this.username = username;
  }
}

export default Identity;
