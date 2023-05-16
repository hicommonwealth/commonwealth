import type { Web3Provider } from '@ethersproject/providers';

import type { TypedEvent } from '../../../contractTypes/commons';
import type { ERC721 } from '../../../contractTypes';

interface IErc721Contract {
  contract: ERC721;
  tokenName?: string;
}

export interface IErc721Contracts {
  tokens: IErc721Contract[];
  provider: Web3Provider;
}

export interface ListenerOptions {
  url: string;
  tokenAddresses: string[];
  tokenNames?: string[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type RawEvent = TypedEvent<any>;

// eslint-disable-next-line no-shadow
export enum EventKind {
  // Erc721 Events
  Approval = 'approval',
  ApprovalForAll = 'approval for all',
  Transfer = 'transfer',
}

interface IEvent {
  kind: EventKind;
}

type Address = string;
type TokenID = string;

// Erc721 Event Interfaces
export interface IApproval extends IEvent {
  kind: EventKind.Approval;
  owner: Address;
  approved: Address;
  tokenId: TokenID;
  contractAddress: Address;
}

export interface IApprovalForAll extends IEvent {
  kind: EventKind.ApprovalForAll;
  owner: Address;
  operator: Address;
  approved: boolean;
  contractAddress: Address;
}

export interface ITransfer extends IEvent {
  kind: EventKind.Transfer;
  from: Address;
  to: Address;
  tokenId: TokenID;
  contractAddress: Address;
}

export type IEventData = IApproval | IApprovalForAll | ITransfer;

export const EventKinds: EventKind[] = Object.values(EventKind);
