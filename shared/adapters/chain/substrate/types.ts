import BN from 'bn.js';
import { IIdentifiable, ICompletable } from '../../shared';
import { Coin } from '../../currency';
import { IMethod } from './shared';
import { u128, Compact } from '@polkadot/types';
import { Balance } from '@polkadot/types/interfaces';
import { Registry } from '@polkadot/types/types';

export class SubstrateCoin extends Coin {
  constructor(
    denom: string,
    n: number | u128 | BN | SubstrateCoin | Compact<u128>,
    dollar: BN,
    inDollars: boolean = false,
  ) {
    if (n instanceof SubstrateCoin) {
      super(denom, n.asBN, inDollars, dollar);
    } else if (n instanceof Compact || n instanceof u128) {
      super(denom, n.toBn(), inDollars, dollar);
    } else {
      super(denom, n, inDollars, dollar);
    }
  }
}

export enum DemocracyThreshold {
  Supermajorityapproval = 'Supermajorityapproval',
  Supermajorityrejection = 'Supermajorityrejection',
  Simplemajority = 'Simplemajority',
}

export interface ISubstrateDemocracyProposal extends IIdentifiable {
  index: number;
  hash: Uint8Array;
  deposit: u128;
  author: string;
}

export interface ISubstrateDemocracyProposalState extends ICompletable {
  method: IMethod;
  depositors: string[];
}

export interface ISubstrateDemocracyReferendum extends IIdentifiable {
  index: number;
  hash?: Uint8Array;
  endBlock: number;
  threshold?: DemocracyThreshold;
  executionDelay?: number;
}

export interface ISubstrateDemocracyReferendumState extends ICompletable {
  method: IMethod;
  votes: { [account: string]: [boolean, number, u128] }; // choice, weight (conviction idx), balance
  cancelled: boolean; // can only be done via council
  passed: boolean;
  executed: boolean;
  executionBlock: number;
}

export interface ISubstrateTreasuryProposal extends IIdentifiable {
  index: number;
  value: u128;
  beneficiary: string;
  bond: u128;
  proposer: string;
}

export interface ISubstrateTreasuryProposalState extends ICompletable {
  approved: boolean;
  awarded: boolean;
}

export interface ISubstrateCollectiveProposal extends IIdentifiable {
  hash: string;
  index: number;
  method: IMethod;
  threshold: number;
}

export interface ISubstrateCollectiveProposalState extends ICompletable {
  votes: { [voter: string]: boolean };
  approved: boolean;
}

export interface ISubstratePhragmenElection extends IIdentifiable {
  round: number;
  endBlock: number;
}

export interface IPhragmenVote {
  votes: string[];
  stake: u128;
}

export interface IPhragmenResult {
  who: string;
  score: u128;
}

export interface ISubstratePhragmenElectionState extends ICompletable {
  candidates: string[];
}
