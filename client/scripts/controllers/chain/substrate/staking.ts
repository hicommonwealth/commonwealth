/* eslint-disable consistent-return */
import BN from 'bn.js';
import { IApp } from 'state';
import { ApiRx } from '@polkadot/api';
import moment from 'moment';
import { StorageModule } from 'models';
import { StakingStore } from 'stores';
import { Option, StorageKey, Vec } from '@polkadot/types';
import { formatNumber } from '@polkadot/util';
import { Observable, combineLatest, of, from } from 'rxjs';
import { HeaderExtended } from '@polkadot/api-derive';
import { map, flatMap, auditTime, switchMap, catchError } from 'rxjs/operators';
import {
  EraIndex, AccountId, Exposure,
  SessionIndex, EraRewardPoints, Nominations
} from '@polkadot/types/interfaces';
import { InterfaceTypes } from '@polkadot/types/types';
import {
  DeriveStakingValidators, DeriveStakingQuery, DeriveSessionInfo,
  DeriveSessionProgress, DeriveAccountInfo, DeriveAccountRegistration,
  DeriveHeartbeatAuthor, DeriveStakingElected
} from '@polkadot/api-derive/types';
import { IValidators, IValidatorData } from './account';
import SubstrateChain from './shared';

const MAX_HEADERS = 50;

interface iInfo {
  stash: string;
  balance: number;
}

interface IReward {
  diff: number;
  avgReward: string;
  daysDiff: number;
  validators: {
    [key: string]: any[];
  };
}

export interface ICommissionInfo {
  [key: string]: number | string
}

export interface IAccountInfo extends DeriveAccountRegistration {
  name: string;
  isBad: boolean;
  isErroneous: boolean;
  isExistent: boolean;
  isGood: boolean;
  isKnownGood: boolean;
  isLowQuality: boolean;
  isReasonable: boolean;
  waitCount: number;
}
export interface IValidatorPageStateNew {
  dynamic: {
    validators: {
      "status": "Success",
      "stats": {
        "count": 20,
        rows: []
      }
    }
  };
}
function extractNominators(nominations: [StorageKey, Option<Nominations>][]): Record<string, iInfo[]> {
  return nominations.reduce((mapped: Record<string, iInfo[]>, [key, optNoms]) => {
    if (optNoms.isSome) {
      const nominatorId = key.args[0].toString();

      optNoms.unwrap().targets.forEach((_validatorId, index): void => {
        const validatorId = _validatorId.toString();
        const info = { stash: nominatorId, balance: index + 1 };

        if (!mapped[validatorId]) {
          mapped[validatorId] = [info];
        } else {
          mapped[validatorId].push(info);
        }
      });
    }

    return mapped;
  }, {});
}

class SubstrateStaking implements StorageModule {
  private _initialized: boolean = false;

  public get initialized() { return this._initialized; }

  // STORAGE
  private _store = new StakingStore();
  public get store() { return this._store; }
  public lastHeaders: HeaderExtended[] = [];
  public byAuthor: Record<string, string> = {};
  public nominations: Record<string, iInfo[]> = {};
  private _Chain: SubstrateChain;

  private _app: IApp;
  public get app() { return this._app; }

  constructor(app: IApp) {
    this._app = app;
  }
  public createType<K extends keyof InterfaceTypes>(type: K, ...params: any[]): InterfaceTypes[K] {
    return this._Chain.registry.createType(type, ...params);
  }
  public get nominatedBy(): Observable<Record<string, iInfo[]>> {
    return this._Chain.query(
      (api: ApiRx) => api.query.staking.nominators.entries()
    ).pipe(map((nominations: any) => {
      this.nominations = extractNominators(nominations);
      return this.nominations;
    }));
  }
  public get validatorCount(): Observable<SessionIndex> {
    return this._Chain.query((api: ApiRx) => api.query.staking.validatorCount());
  }
  public get sessionInfo(): Observable<DeriveSessionProgress | DeriveSessionInfo> {
    return this._Chain.api.pipe(
      switchMap((api: ApiRx) => {
        return combineLatest(
          api.derive.session.progress()
        );
      }),
      map(([info]: [DeriveSessionProgress]) => {
        return info;
      }),
      catchError(() => {
        return this._Chain.query((api: ApiRx) => api.derive.session.info());
      })
    );
  }
  public info(address: string): Observable<IAccountInfo> {
    return this._Chain.query(
      (api: ApiRx) => api.derive.accounts.info(address)
    ).pipe(map((accountInfo: DeriveAccountInfo) => {
      let info: IAccountInfo;
      const { accountIndex: anAccountIndex, identity, nickname } = accountInfo || {};
      const name = identity?.display
        ? identity?.display
        : nickname;
      if (identity) {
        const judgements = identity.judgements.filter(([, judgement]) => !judgement.isFeePaid);
        const isKnownGood = judgements.some(([, judgement]) => judgement.isKnownGood);
        const isReasonable = judgements.some(([, judgement]) => judgement.isReasonable);
        const isErroneous = judgements.some(([, judgement]) => judgement.isErroneous);
        const isLowQuality = judgements.some(([, judgement]) => judgement.isLowQuality);
        info = {
          name,
          ...identity,
          isBad: isErroneous || isLowQuality,
          isErroneous,
          isExistent: !!identity.display,
          isGood: isKnownGood || isReasonable,
          isKnownGood,
          isLowQuality,
          isReasonable,
          waitCount: identity.judgements.length - judgements.length
        };
      }
      info.name = name || '';
      return info;
    }));
  }


  // { stash: AccountId; controller: AccountId; sessionKeys: AccountId[]; state: Active | Waiting | Inactive;
  //  lastUpdate: BlockNumber; }
  public globalstatistics() {
    return this._app.staking.globalStatistics();
  }
  public get validators(): Observable<IValidators> {
    return this._Chain.api.pipe(
      switchMap((api: ApiRx) => combineLatest(
        of(api),
        api.derive.staking.validators(),
        api.query.staking.currentEra(),
        api.derive.staking.stashes(),
        api.derive.staking.currentPoints(),
        api.derive.imOnline.receivedHeartbeats(),
        api.derive.staking.electedInfo(),
      )),

      // fetch balances alongside validators
      flatMap((
        [api, { nextElected, validators: currentSet }, era, allStashes,
          queryPoints, imOnline, electedInfo, stats]:
          [ApiRx, DeriveStakingValidators, EraIndex, AccountId[],
            EraRewardPoints, Record<string, DeriveHeartbeatAuthor>, DeriveStakingElected, {}]
      ) => {
        const eraPoints: Record<string, string> = {};
        const entries = [...queryPoints.individual.entries()]
          .map(([accountId, points]) => [accountId.toString(), formatNumber(points)]);
        entries.forEach(([accountId, points]): void => {
          eraPoints[accountId] = points;
        });
        const commissionInfo: ICommissionInfo = {};

        electedInfo.info.forEach(({ accountId, validatorPrefs }) => {
          const commissionPer = (validatorPrefs.commission.unwrap() || new BN(0)).toNumber() / 10_000_000;
          const key = accountId.toString();
          commissionInfo[key] = commissionPer;
          return commissionPer;
        });
        // set of not yet but future validators
        const waiting = allStashes.filter((v) => !currentSet.includes(v));
        const toBeElected = nextElected.filter((v) => !currentSet.includes(v));

        // Different runtimes call for different access to stakers: old vs. new
        const stakersCall = (api.query.staking.stakers) ? api.query.staking.stakers : api.query.staking.erasStakers;
        // Different staking functions call for different function arguments: old vs. new
        const stakersCallArgs = (account) => (api.query.staking.stakers) ? account : [era.toString(), account];
        return combineLatest(
          of(currentSet),
          of(toBeElected),
          api.query.staking.bonded.multi(currentSet.map((elt) => elt.toString())),
          stakersCall.multi(currentSet.map((elt) => stakersCallArgs(elt.toString()))),
          api.query.staking.bonded.multi(toBeElected.map((elt) => elt.toString())),
          stakersCall.multi(toBeElected.map((elt) => stakersCallArgs(elt.toString()))),
          of(waiting),
          of(eraPoints),
          of(imOnline),
          of(commissionInfo), of(stats)
        );
      }),
      auditTime(100),
      map(([
        currentSet, toBeElected, controllers, exposures,
        nextUpControllers, nextUpExposures, waiting, eraPoints,
        imOnline, commissionInfo, stats
      ]: [
          AccountId[], AccountId[], Vec<AccountId>, Exposure[],
          Vec<AccountId>, Exposure[], Uint32Array[], Record<string, string>,
          Record<string, DeriveHeartbeatAuthor>, ICommissionInfo, {}
        ]) => {
        const result: IValidators = {};
        for (let i = 0; i < currentSet.length; ++i) {
          const key = currentSet[i].toString();
          result[key] = {
            exposure: exposures[i],
            otherTotal: exposures[i]?.total.unwrap().sub(exposures[i]?.own.unwrap()),
            controller: controllers[i].toString(),
            isElected: true,
            toBeElected: false,
            eraPoints: eraPoints[key],
            blockCount: imOnline[key]?.blockCount,
            hasMessage: imOnline[key]?.hasMessage,
            isOnline: imOnline[key]?.isOnline,
            commissionPer: Number(commissionInfo[key]),

          };
        }
        // add set of next elected
        for (let i = 0; i < toBeElected.length; ++i) {
          const key = toBeElected[i].toString();
          result[key] = {
            exposure: nextUpExposures[i],
            otherTotal: exposures[i]?.total.unwrap().sub(exposures[i]?.own.unwrap()),
            controller: nextUpControllers[i].toString(),
            isElected: false,
            toBeElected: true,
            eraPoints: eraPoints[key],
            blockCount: imOnline[key]?.blockCount,
            hasMessage: imOnline[key]?.hasMessage,
            isOnline: imOnline[key]?.isOnline,
            commissionPer: Number(commissionInfo[key])
          };
        }
        // add set of waiting validators
        for (let i = 0; i < waiting.length; ++i) {
          const key = waiting[i].toString();
          result[key] = {
            exposure: null,
            controller: null,
            isElected: false,
            toBeElected: false,
            eraPoints: eraPoints[key],
            blockCount: imOnline[key]?.blockCount,
            hasMessage: imOnline[key]?.hasMessage,
            isOnline: imOnline[key]?.isOnline
          };
        }

        return result;
      }),
    );
  }
  public query(address: string): Observable<DeriveStakingQuery> {
    return this._Chain.query((api: ApiRx) => api.derive.staking.query(address));
  }
  // public get annualPercentRate(): Observable<ICommissionInfo> {
  //   return this._Chain.api.pipe(
  //     switchMap((api: ApiRx) => combineLatest(
  //       of(api),
  //       api.derive.staking.validators(),
  //       api.query.staking.currentEra(),
  //       api.derive.staking.electedInfo()
  //     )),
  //     flatMap((
  //       [api, { validators: currentSet }, era, electedInfo]:
  //       [ApiRx, DeriveStakingValidators, Option<EraIndex>, DeriveStakingElected]
  //     ) => {
  //       const commission: ICommissionInfo = {};

  //       electedInfo.info.forEach(({ accountId, validatorPrefs }) => {
  //         const key = accountId.toString();
  //         commission[key] = (validatorPrefs.commission.unwrap() || new BN(0)).toNumber() / 10_000_000;
  //         return commission[key];
  //       });
  //       // Different runtimes call for different access to stakers: old vs. new
  //       const stakersCall = (api.query.staking.stakers)
  //         ? api.query.staking.stakers
  //         : api.query.staking.erasStakers;
  //       // Different staking functions call for different function arguments: old vs. new
  //       const stakersCallArgs = (account) => (api.query.staking.stakers)
  //         ? account
  //         : [era.toString(), account];
  //       return combineLatest(
  //         stakersCall.multi(currentSet.map((elt) => stakersCallArgs(elt.toString()))),
  //         of(currentSet),
  //         from(this._app.chainEvents.rewards()),
  //         of(commission)
  //       );
  //     }),
  //     auditTime(100),
  //     map(([exposures, accounts, rewards, commissions ] :
  //       [Exposure[], AccountId[], IReward, ICommissionInfo ]) => {
  //       const data = {};
  //       const n = 1000000000;
  //       const validatorRewards: ICommissionInfo = {};
  //       accounts.forEach((account, index) => {
  //         let key = account.toString();
  //         const exposure = exposures[index];
  //         const totalStake = exposure.total.toBn();
  //         const comm = commissions[key] || 0;
  //         if (Object.keys(rewards.validators).length === 1) {
  //           key = this._app.chain.id;
  //         }

  //         const valRewards = rewards.validators[key];
  //         if (valRewards) {
  //           const amount = valRewards[valRewards.length - 1].event_data.amount;
  //           const firstReward = new BN(amount.toString()).muln(Number(comm)).divn(100);
  //           const secondReward = exposure.own.toBn()
  //             .mul((new BN(amount.toString())).sub(firstReward))
  //             .div(totalStake || new BN(1));
  //           const totalReward = firstReward.add(secondReward);
  //           const length = rewards.validators[key].length;
  //           if (valRewards.length > 1) {
  //             const last = rewards.validators[key][length - 1];
  //             const secondLast = rewards.validators[key][length - 2];
  //             const start = moment(secondLast.created_at);
  //             const end = moment(last.created_at);
  //             const startBlock = secondLast.block_number;
  //             const endBlock = last.block_number;
  //             const eventDiff = end.diff(start, 'seconds');

  //             const periodsInYear = (60 * 60 * 24 * 7 * 52) / eventDiff;
  //             const percentage = (new BN(totalReward))
  //               .mul(new BN(n))
  //               .div(totalStake || new BN(1))
  //               .toNumber() / n;
  //             const apr = percentage * periodsInYear;
  //             validatorRewards[account.toString()] = apr;
  //           }
  //         } else {
  //           validatorRewards[account.toString()] = -1.0;
  //         }
  //       });

  //       return validatorRewards;
  //     }),
  //   );
  // }
  public get lastHeader(): Observable<HeaderExtended> {
    return this._Chain.query(
      (api: ApiRx) => api.derive.chain.subscribeNewHeads()
    ).pipe(map((lastHeader: HeaderExtended) => {
      if (lastHeader?.number) {
        const blockNumber = lastHeader.number.unwrap();
        const thisBlockAuthor = lastHeader.author?.toString();
        const thisBlockNumber = formatNumber(blockNumber);

        if (thisBlockAuthor) {
          this.byAuthor[thisBlockAuthor] = thisBlockNumber;
        }

        this.lastHeaders = this.lastHeaders
          .filter((old, index): boolean => index < MAX_HEADERS && old.number.unwrap().lt(blockNumber))
          .reduce((next, header): HeaderExtended[] => {
            next.push(header);

            return next;
          }, [lastHeader])
          .sort((a, b) => b.number.unwrap().cmp(a.number.unwrap()));
      }
      return lastHeader;
    }));
  }
  public deinit() {
    this._initialized = false;
  }
  public init(ChainInfo: SubstrateChain): Promise<void> {
    this._Chain = ChainInfo;
    this._initialized = true;
    return Promise.resolve();
  }
}

export default SubstrateStaking;
