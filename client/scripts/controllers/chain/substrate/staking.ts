/* eslint-disable consistent-return */
import BN from 'bn.js';
import { IApp } from 'state';
import { ApiRx } from '@polkadot/api';
import { StorageModule } from 'models';
import { StakingStore } from 'stores';
import { Option, StorageKey, Vec } from '@polkadot/types';
import { formatNumber } from '@polkadot/util';
import { Observable, combineLatest, of, from } from 'rxjs';
import { HeaderExtended } from '@polkadot/api-derive';
import { map, flatMap, auditTime, switchMap } from 'rxjs/operators';
import Substrate from 'controllers/chain/substrate/main';
import { SubstrateCoin } from 'adapters/chain/substrate/types';
import { EraIndex, AccountId, Exposure,
  SessionIndex, EraRewardPoints, Nominations, Balance } from '@polkadot/types/interfaces';
import { InterfaceTypes, Codec } from '@polkadot/types/types';
import { DeriveStakingValidators, DeriveStakingQuery,
  DeriveSessionProgress, DeriveAccountInfo, DeriveAccountRegistration,
  DeriveHeartbeatAuthor, DeriveStakingElected } from '@polkadot/api-derive/types';
import { IValidators } from './account';
import SubstrateChain from './shared';

const MAX_HEADERS = 50;

interface iInfo {
  stash: string;
  balance: number;
}

interface IReward {
  daysDiff: number;
  validators: {
    [key: string]: number
  };
}

export interface ICommissionInfo {
  [key: string]: number
}

export interface IAccountInfo extends DeriveAccountRegistration{
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

function extractNominators(nominations: [StorageKey, Option<Nominations>][]): Record<string, iInfo[]> {
  return nominations.reduce((mapped: Record<string, iInfo[]>, [key, optNoms]) => {
    if (optNoms.isSome) {
      const nominatorId = key.args[0].toString();

      optNoms.unwrap().targets.forEach((_validatorId, index): void => {
        const validatorId = _validatorId.toString();
        const info = { stash : nominatorId, balance:  index + 1 };

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
  public get sessionInfo(): Observable<DeriveSessionProgress> {
    return this._Chain.query((api: ApiRx) => api.derive.session.progress());
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

  private mapCommission(electedInfo: DeriveStakingElected) : ICommissionInfo {
    const commissionInfo: ICommissionInfo = {};
    electedInfo.info.forEach(({ accountId, validatorPrefs }) => {
      let commissionPer = new BN(0);
      if (validatorPrefs.commission)
        commissionPer = validatorPrefs.commission.unwrap();
      const commissionPercent = commissionPer.toNumber() / 10_000_000;
      const key = accountId.toString();
      commissionInfo[key] = commissionPercent;
    });
    return commissionInfo;
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
        api.derive.staking.electedInfo()
      )),

      // fetch balances alongside validators
      flatMap((
        [api, { nextElected, validators: currentSet }, era, allStashes,
          queryPoints, imOnline, electedInfo]:
        [ApiRx, DeriveStakingValidators, EraIndex, AccountId[],
        EraRewardPoints, Record<string, DeriveHeartbeatAuthor>, DeriveStakingElected]
      ) => {
        const eraPoints: Record<string, string> = {};
        const entries = [...queryPoints.individual.entries()]
          .map(([accountId, points]) => [accountId.toString(), formatNumber(points)]);
        entries.forEach(([accountId, points]): void => {
          eraPoints[accountId] = points;
        });
        const commissionInfo: ICommissionInfo = this.mapCommission(electedInfo);

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
          of(commissionInfo)
        );
      }),
      auditTime(100),
      map(([
        currentSet, toBeElected, controllers, exposures,
        nextUpControllers, nextUpExposures, waiting, eraPoints,
        imOnline, commissionInfo
      ] : [
        AccountId[], AccountId[], Vec<AccountId>, Exposure[],
        Vec<AccountId>, Exposure[], Uint32Array[], Record<string, string>,
        Record<string, DeriveHeartbeatAuthor>, ICommissionInfo
      ]) => {
        const result: IValidators = {};
        for (let i = 0; i < currentSet.length; ++i) {
          let total = new BN(0);
          let own = new BN(0);
          if (exposures[i]?.total)
            total = exposures[i]?.total.unwrap();
          if (exposures[i]?.own)
            own = exposures[i]?.own.unwrap();

          const key = currentSet[i].toString();
          result[key] = {
            exposure: exposures[i],
            otherTotal: total.sub(own),
            controller: controllers[i].toString(),
            isElected: true,
            toBeElected: false,
            eraPoints: eraPoints[key],
            blockCount: imOnline[key]?.blockCount,
            hasMessage: imOnline[key]?.hasMessage,
            isOnline: imOnline[key]?.isOnline,
            commissionPer: commissionInfo[key]
          };
        }
        // add set of next elected
        for (let i = 0; i < toBeElected.length; ++i) {
          let total = new BN(0);
          let own = new BN(0);
          if (exposures[i]?.total)
            total = exposures[i]?.total.unwrap();
          if (exposures[i]?.own)
            own = exposures[i]?.own.unwrap();

          const key = toBeElected[i].toString();
          result[key] = {
            exposure: nextUpExposures[i],
            otherTotal: total.sub(own),
            controller: nextUpControllers[i].toString(),
            isElected: false,
            toBeElected: true,
            eraPoints: eraPoints[key],
            blockCount: imOnline[key]?.blockCount,
            hasMessage: imOnline[key]?.hasMessage,
            isOnline: imOnline[key]?.isOnline,
            commissionPer: commissionInfo[key]
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
  public get annualPercentRate(): Observable<ICommissionInfo> {
    return this._Chain.api.pipe(
      switchMap((api: ApiRx) => combineLatest(
        of(api),
        api.derive.staking.validators(),
        api.query.staking.currentEra(),
        from(this._app.chainEvents.rewards()),
        api.derive.staking.electedInfo()
      )),
      flatMap((
        [api, { validators: currentSet }, era, rewards, electedInfo]:
        [ApiRx, DeriveStakingValidators, EraIndex, IReward, DeriveStakingElected]
      ) => {
        const commission: ICommissionInfo = this.mapCommission(electedInfo);
        // Different runtimes call for different access to stakers: old vs. new
        const stakersCall = (api.query.staking.stakers)
          ? api.query.staking.stakers
          : api.query.staking.erasStakers;
        // Different staking functions call for different function arguments: old vs. new
        const stakersCallArgs = (account) => (api.query.staking.stakers)
          ? account
          : [era.toString(), account];
        return combineLatest(
          stakersCall.multi(currentSet.map((elt) => stakersCallArgs(elt.toString()))),
          of(currentSet),
          of(rewards),
          of(commission)
        );
      }),
      auditTime(100),
      map(([exposures, accounts, rewards, commissions ] :
        [Exposure[], AccountId[], IReward, ICommissionInfo ]) => {
        // coins.div don't support fraction points. multiply and divide the same number will give fraction points.
        const n = 100000;
        const validatorRewards: ICommissionInfo = {};
        // The only difference between edgeware and kusama is reward event for edgeware doesn't
        // save validator address to ChainEvents ->> event_data.
        // So edgware distribute rewards between every validator equally for a given interval.
        // The backend API returns rewards for a given interval from /getRewards for chain-id.
        // The /getRewards API sum all rewards to chain-id key if ChainEvents ->> event_data has no validator address.
        accounts.forEach((account, index) => {
          const key = account.toString();
          const exposure = exposures[index];
          // validator's share in percent from the staked amount
          let stakeShare = 0;
          // nominators amount from the staked amount
          let othersStake: BN = new BN(0);

          exposure.others.forEach((indv) => {
            othersStake = othersStake.add(indv.value.toBn());
          });
          othersStake = othersStake.add(exposure.own.toBn());
          if (othersStake.gt(new BN(0))) {
            stakeShare = exposure.own.toBn().muln(n).div(othersStake).toNumber() / n;
          }
          // validator total stake.
          const totalStake = exposure?.total.toBn() || new BN(0);
          // validator total reward.
          let totalReward = rewards.validators[key] || 0;

          // if rewards event has key for chain id, split with every validator equally.
          if (rewards.validators[this._app.chain.id]) {
            // The sum reward to chain-id key is distributed to every validator
            totalReward += rewards.validators[this._app.chain.id] / accounts.length;
          }
          // calculate commission for current validator.
          const commissionPercent: number = (commissions[key] || 0) / 100;
          // calculate reward for the validator for given commission
          let rewardEarn = totalReward * commissionPercent;
          // calculate nominators reward
          const othersReward = totalReward - rewardEarn;
          // Number too large error on converting to BN
          // rewardEarn is the share of validator in rewards from event "reward".
          rewardEarn += stakeShare * othersReward;

          // percent of validato reward and validatot stake
          let percentage = 0;

          if (totalStake.gt(new BN(0))) {
            const rewardBN = (this._app.chain as Substrate).chain.coins(rewardEarn);
            const totalStakeBN = (this._app.chain as Substrate).chain.coins(totalStake);
            // Number can only safely store up to 53 bits for toNumber function.
            percentage = +rewardBN.muln(n).div(totalStakeBN).toString() / n;
          }
          // rewards.daysDiff
          // number of days between last reward record and latest reward record through events to ChainEvents
          // calculating APR - Annual Percentage Rate for a validator.
          // ( ( ( total earnings / total stake ) / total days of rewards recorded) * one year) / 100
          validatorRewards[key] = ((percentage / (rewards.daysDiff || 1)) * 365) / 100;
        });
        return validatorRewards;
      }),
    );
  }
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
    this._app.chainEvents.rewards()
    .then((rewards)=>{
      this.rewards = rewards;
    })
    return Promise.resolve();
  }
}

export default SubstrateStaking;
