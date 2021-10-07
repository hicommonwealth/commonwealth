import { Web3Provider } from '@ethersproject/providers';
import BN from 'bn.js';

import { TypedEvent } from '../../contractTypes/commons';
import { ERC20 } from '../../contractTypes';

import { EnricherConfig } from './filters/enricher';

interface IErc20Contract {
  contract: ERC20;
  totalSupply: BN;
  tokenName?: string;
}

export interface IErc20Contracts {
  tokens: IErc20Contract[];
  provider: Web3Provider;
}

export interface ListenerOptions {
  url: string;
  tokenAddresses: string[];
  tokenNames?: string[];
  enricherConfig: EnricherConfig;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
type Balance = string;

// Erc20 Event Interfaces
export interface IApproval extends IEvent {
  kind: EventKind.Approval;
  owner: Address;
  spender: Address;
  value: Balance;
  contractAddress: Address;
}

export interface ITransfer extends IEvent {
  kind: EventKind.Transfer;
  from: Address;
  to: Address;
  value: Balance;
  contractAddress: Address;
}

export type IEventData = IApproval | ITransfer;

export const EventKinds: EventKind[] = Object.values(EventKind);
