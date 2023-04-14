import { Compact, u128 } from '@polkadot/types';
import type { Call } from '@polkadot/types/interfaces';
import type { Codec } from '@polkadot/types/types';
import type BN from 'bn.js';
import { Coin } from '../../currency';
import type { IIdentifiable } from '../../shared';

export function formatCall(
  c: Call | { section: string; method: string; args: string[] }
): string {
  // build args string
  const args: (string | Codec)[] = c.args;
  const argsStr = args
    .map((v: Codec | string): string => {
      if (!v) return '[unknown]';
      const vStr = v.toString();
      if (vStr.length < 16) return vStr;
      return `${vStr.slice(0, 15)}…`;
    })
    .join(', ');

  // finish format
  return `${c.section}.${c.method}(${argsStr})`;
}

export class SubstrateCoin extends Coin {
  constructor(
    denom: string,
    n: number | u128 | BN | SubstrateCoin | Compact<u128>,
    dollar: BN,
    inDollars = false
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

export interface ISubstrateDemocracyReferendum extends IIdentifiable {
  index: number;
  hash?: Uint8Array;
  endBlock: number;
  threshold?: DemocracyThreshold;
  executionDelay?: number;
}

export interface ISubstrateTreasuryProposal extends IIdentifiable {
  index: number;
  value: u128;
  beneficiary: string;
  bond: u128;
  proposer: string;
}

export interface ISubstrateTreasuryTip extends IIdentifiable {
  hash: string;
  reason: string;
  who: string;
  finder: string;
  deposit: u128;
  findersFee: boolean;
  closing?: number;
  payout?: u128;
}
