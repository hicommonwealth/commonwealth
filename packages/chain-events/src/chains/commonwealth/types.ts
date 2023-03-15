/* eslint-disable no-shadow */
import type { Web3Provider } from '@ethersproject/providers';

import type {
  IProjectBaseFactory,
  ICuratedProject,
  IERC20,
} from '../../contractTypes';
import type { TypedEvent } from '../../contractTypes/commons';

// options for the listener class
export interface ListenerOptions {
  url: string;
  skipCatchup: boolean;
  contractAddress: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type RawEvent = TypedEvent<any>;

export enum ContractType {
  AAVE = 'aave',
  COMPOUND = 'compound',
  ERC20 = 'erc20',
  ERC721 = 'erc721',
  MARLINTESTNET = 'marlin-testnet',
  SPL = 'spl',
  COMMONPROTOCOL = 'common-protocol',
}

export enum CommonContractType {
  Factory,
  Project,
  cToken,
  bToken,
}

export type ProjectApi = {
  project: ICuratedProject;
  isCurated: boolean;
  bToken: IERC20;
  cToken?: IERC20;
};

export type Api = {
  factory: IProjectBaseFactory;
  projects: ProjectApi[];
  provider: Web3Provider;
};

// eslint-disable-next-line no-shadow
export enum EntityKind {
  // eslint-disable-next-line no-shadow
  Project = 'project',
}

export enum EventKind {
  ProjectCreated = 'project-created',
  ProjectBacked = 'project-backed',
  ProjectCurated = 'project-curated',
  ProjectSucceeded = 'project-succeeded',
  ProjectFailed = 'project-failed',
  ProjectWithdraw = 'project-withdraw',
}

interface IEvent {
  kind: EventKind;
}

type Address = string;
type Balance = string; // queried as BigNumber

export interface IProjectCreated extends IEvent {
  kind: EventKind.ProjectCreated;
  id: Address;
  index: string; // BN

  // metadata
  name: string;
  ipfsHash: string;
  cwUrl: string;
  creator: Address;

  // contract init info
  beneficiary: Address;
  acceptedToken: Address;
  curatorFee: Balance;
  threshold: Balance;
  deadline: number;
  fundingAmount: Balance;
}

export interface IProjectBacked extends IEvent {
  kind: EventKind.ProjectBacked;
  id: Address;
  sender: Address;
  token: Address;
  amount: Balance;
}

export interface IProjectCurated extends IEvent {
  kind: EventKind.ProjectCurated;
  id: Address;
  sender: Address;
  token: Address;
  amount: Balance;
}

export interface IProjectSucceeded extends IEvent {
  kind: EventKind.ProjectSucceeded;
  id: Address;
  timestamp: string; // BN
  amount: Balance;
}

export interface IProjectFailed extends IEvent {
  kind: EventKind.ProjectFailed;
  id: Address;
}

export interface IProjectWithdraw extends IEvent {
  kind: EventKind.ProjectWithdraw;
  id: Address;
  sender: Address;
  token: Address;
  amount: Balance;
  withdrawalType: string; // plaintext
}

export type IEventData =
  | IProjectCreated
  | IProjectBacked
  | IProjectCurated
  | IProjectSucceeded
  | IProjectFailed
  | IProjectWithdraw;

export const EventKinds: EventKind[] = Object.values(EventKind);
