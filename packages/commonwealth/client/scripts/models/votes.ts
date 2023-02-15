import type { Coin } from 'adapters/currency';
import type { IVote } from './interfaces';
import AddressAccount from "models/AddressAccount";

export class DepositVote<C extends Coin> implements IVote<C> {
  public readonly account: AddressAccount
  public readonly deposit: C;

  constructor(account: AddressAccount, deposit: C) {
    this.account = account;
    this.deposit = deposit;
  }
}

export class BinaryVote<C extends Coin> implements IVote<C> {
  public readonly account: AddressAccount
  public readonly choice: boolean;
  public readonly amount: number;
  public readonly weight: number;

  constructor(
    account: AddressAccount,
    choice: boolean,
    amount?: number,
    weight?: number
  ) {
    this.account = account;
    this.choice = choice;
    this.amount = amount;
    this.weight = weight;
  }
}
