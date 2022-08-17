import { Coin } from 'adapters/currency';
import { IVote } from './interfaces';
import Account from './Account';

export class DepositVote<C extends Coin> implements IVote<C> {
  public readonly account: Account;
  public readonly deposit: C;
  constructor(account: Account, deposit: C) {
    this.account = account;
    this.deposit = deposit;
  }
}

export class BinaryVote<C extends Coin> implements IVote<C> {
  public readonly account: Account;
  public readonly choice: boolean;
  public readonly amount: number;
  public readonly weight: number;
  constructor(account: Account, choice: boolean, amount?: number, weight?: number) {
    this.account = account;
    this.choice = choice;
    this.amount = amount;
    this.weight = weight;
  }
}
