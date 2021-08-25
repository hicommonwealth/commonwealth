import { Web3Provider } from '@ethersproject/providers';

import { TypedEvent } from '../../contractTypes/commons';
import { ERC20 } from '../../contractTypes';

// API is imported contracts classes
interface IErc20Contracts {
  tokens: ERC20[];
  provider: Web3Provider;
  tokenNames?: string[];
}

export interface ListenerOptions {
  url: string;
  tokenAddresses: string[];
  tokenNames?: string[];
}

export type Api = IErc20Contracts;

export const EventChains = ['erc20'] as const;

export type RawEvent = TypedEvent<any>;

// eslint-disable-next-line no-shadow
export enum EventKind {
  // Erc20 Events
  Approval = 'approval',
  Transfer = 'transfer',
}

interface IEvent {
  kind: EventKind;
}

type Address = string;

// Erc20 Event Interfaces
export interface IApproval extends IEvent {
  kind: EventKind.Approval;
  owner: Address;
  spender: Address;
  value: number;
  contractAddress: Address;
}

export interface ITransfer extends IEvent {
  kind: EventKind.Transfer;
  from: Address;
  to: Address;
  value: number;
  contractAddress: Address;
}

export type IEventData = IApproval | ITransfer;
// eslint-disable-next-line semi-style

export class Token {
  public name: string;

  public symbol: string;

  public address: string;

  constructor(name: string, symbol: string, address: string) {
    this.name = name;
    this.symbol = symbol;
    this.address = address;
  }
}

export const EventKinds: EventKind[] = Object.values(EventKind);
