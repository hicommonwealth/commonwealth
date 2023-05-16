/* eslint-disable func-names */
/* eslint-disable dot-notation */
import type { ApiPromise } from '@polkadot/api';
import type { Option } from '@polkadot/types';
import type {
  IdentityJudgement,
  AccountVote,
} from '@polkadot/types/interfaces';
import type { Codec } from '@polkadot/types/types';

import { IdentityJudgement as JudgementEnum } from 'chain-events/src/chain-bases/substrate/types';

export function constructOption<T extends Codec>(value?: T): Option<T> {
  if (value) {
    return {
      isSome: true,
      isNone: false,
      isEmpty: false,
      value,
      unwrap: () => value,
    } as unknown as Option<T>;
  }
  return {
    isSome: false,
    isNone: true,
    isEmpty: true,
    value: undefined,
    unwrap: () => {
      throw new Error('option is null');
    },
  } as unknown as Option<T>;
}

export function constructIdentityJudgement(
  j: JudgementEnum
): IdentityJudgement {
  const obj = {
    isUnknown: false,
    isFeePaid: false,
    isReasonable: false,
    isKnownGood: false,
    isOutOfDate: false,
    isLowQuality: false,
    isErroneous: false,
  };
  switch (j) {
    case JudgementEnum.Unknown:
      obj.isUnknown = true;
      break;
    case JudgementEnum.Reasonable:
      obj.isReasonable = true;
      break;
    case JudgementEnum.OutOfDate:
      obj.isOutOfDate = true;
      break;
    case JudgementEnum.LowQuality:
      obj.isLowQuality = true;
      break;
    case JudgementEnum.KnownGood:
      obj.isKnownGood = true;
      break;
    case JudgementEnum.FeePaid:
      obj.isFeePaid = true;
      break;
    case JudgementEnum.Erroneous:
      obj.isErroneous = true;
      break;
    default:
      break;
  }
  return obj as unknown as IdentityJudgement;
}

export function constructAccountVote(
  isAye: boolean,
  conviction: number,
  balance: string,
  isSplit = false
): AccountVote {
  if (isSplit) {
    return { isSplit: true, asSplit: {}, isStandard: false } as AccountVote;
  }
  return {
    isSplit: false,
    isStandard: true,
    asStandard: {
      balance,
      vote: {
        isAye,
        isNay: !isAye,
        conviction: {
          index: conviction,
        },
      },
    },
  } as unknown as AccountVote;
}

export function constructFakeApi(callOverrides: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [name: string]: (...args: any[]) => Promise<any>;
}): ApiPromise {
  // TODO: auto-multi everything here
  const identityOf = function (...args) {
    return callOverrides['identityOf'](...args);
  };
  identityOf.multi = callOverrides['identityOfMulti'];

  const blockHash = function (...args) {
    return callOverrides['blockHash'](...args);
  };
  blockHash.multi = callOverrides['blockHash.multi'];

  const events = function (...args) {
    return callOverrides['events'](...args);
  };
  events.at = callOverrides['events.at'];

  const currentIndex = function (...args) {
    return callOverrides['currentIndex'](...args);
  };
  currentIndex.at = callOverrides['currentIndex.at'];

  const validators = function (...args) {
    return callOverrides['validators'](...args);
  };
  validators.at = callOverrides['validators.at'];
  validators.keysAt = callOverrides['validators.keysAt'];

  const bonded = function (...args) {
    return callOverrides['bonded'](...args);
  };
  bonded.at = callOverrides['bonded.at'];

  const stakers = function (...args) {
    return callOverrides['stakers'](...args);
  };
  stakers.at = callOverrides['stakers.at'];
  stakers.keysAt = callOverrides['stakers.keysAt'];

  const currentEra = function (...args) {
    return callOverrides['currentEra'](...args);
  };
  currentEra.at = callOverrides['currentEra.at'];

  const erasRewardPoints = function (...args) {
    return callOverrides['erasRewardPoints'](...args);
  };
  erasRewardPoints.at = callOverrides['erasRewardPoints.at'];

  const currentEraPointsEarned = function (...args) {
    return callOverrides['currentEraPointsEarned'](...args);
  };
  currentEraPointsEarned.at = callOverrides['currentEraPointsEarned.at'];

  const payee = function (...args) {
    return callOverrides['payee'](...args);
  };
  payee.at = callOverrides['payee.at'];

  const proposals = function (...args) {
    return callOverrides['treasuryProposals'](...args);
  };
  proposals.multi = callOverrides['treasuryProposalsMulti'];

  const bounties = function (...args) {
    return callOverrides['treasuryBounties'](...args);
  };
  bounties.multi = callOverrides['bountiesMulti'];

  const tips = function (...args) {
    return callOverrides['tips'](...args);
  };
  tips.keys = callOverrides['tipsKeys'];

  return {
    createType: (name, value) => value,
    queryMulti: (queries) => {
      return Promise.all(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        queries.map((q: any[]) => {
          const qFunc = q[0];
          const qArgs = q.slice(1);
          return qFunc(...qArgs);
        })
      );
    },
    rpc: {
      chain: {
        subscribeNewHeads: callOverrides['subscribeNewHeads'],
        getHeader: callOverrides['getHeader'],
        getBlock: callOverrides['getBlock'],
        getBlockHash: callOverrides['getBlockHash'],
      },
      state: {
        getStorage: callOverrides['getStorage'],
        getRuntimeVersion: callOverrides['getRuntimeVersion'],
        subscribeRuntimeVersion: callOverrides['subscribeRuntimeVersion'],
      },
    },
    query: {
      system: {
        blockHash,
        events,
      },
      balances: {
        totalIssuance: callOverrides['totalIssuance'],
      },
      session: {
        nextKeys: callOverrides['nextKeys'],
        currentIndex,
        validators,
      },
      staking: {
        bonded,
        currentPoints: callOverrides['currentPoints'],
        activeEra: callOverrides['activeEra'],
        stakers,
        currentEra,
        validators,
        erasRewardPoints,
        currentEraPointsEarned,
        payee,
      },
      bounties: {
        bountyCount: callOverrides['bountyCount'],
        bountyDescriptions: callOverrides['bountyDescriptions'],
      },
      democracy: {
        referendumInfoOf: callOverrides['referendumInfoOf'],
        publicProps: callOverrides['publicProps'],
        depositOf: callOverrides['depositOf'],
      },
      electionsPhragmen: {
        members: callOverrides['electionMembers'],
        electionRounds: callOverrides['electionRounds'],
      },
      treasury: {
        proposals,
        approvals: callOverrides['treasuryApprovals'],
        proposalCount: callOverrides['treasuryProposalCount'],
      },
      council: {
        voting: {
          multi: callOverrides['votingMulti'],
        },
        proposals: callOverrides['collectiveProposals'],
        proposalOf: callOverrides['collectiveProposalOf'],
      },
      tips: {
        tips,
        reasons: callOverrides['tipReasons'],
      },
      voting: {
        voteRecords: callOverrides['voteRecords'],
      },
      offences: {
        concurrentReportsIndex: callOverrides['concurrentReportsIndex'],
        reports: {
          multi: callOverrides['reports.multi'],
        },
      },
      identity: {
        identityOf,
        registrars: callOverrides['registrars'],
      },
    },
    derive: {
      chain: {
        bestNumber: callOverrides['bestNumber'],
      },
      staking: {
        validators: callOverrides['validators'],
        electedInfo: callOverrides['electedInfo'],
      },
      bounties: {
        bounties: callOverrides['bounties'],
      },
      democracy: {
        dispatchQueue: callOverrides['dispatchQueue'],
        preimage: callOverrides['preimage'],
        preimages: callOverrides['preimages'],
        referendumsActive: callOverrides['referendumsActive'],
      },
      treasury: {
        proposals: callOverrides['treasuryProposalsDerive'],
      },
      council: {
        proposals: callOverrides['councilProposalsDerive'],
      },
    },
  } as unknown as ApiPromise;
}
