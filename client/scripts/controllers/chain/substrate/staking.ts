/* eslint-disable consistent-return */
import BN from 'bn.js';
import { IApp } from 'state';
import { ApiRx } from '@polkadot/api';
import { StorageModule } from 'models';
import { StakingStore } from 'stores';
import { Option, StorageKey, Vec } from '@polkadot/types';
import { formatNumber } from '@polkadot/util';
import { Observable, combineLatest, of } from 'rxjs';
import { HeaderExtended } from '@polkadot/api-derive';
import { map, flatMap, auditTime, switchMap } from 'rxjs/operators';
import { EraIndex, AccountId, Exposure, SessionIndex, EraRewardPoints, Nominations } from '@polkadot/types/interfaces';
import { InterfaceTypes, Codec } from '@polkadot/types/types';
import { DeriveStakingValidators, DeriveStakingQuery,
  DeriveSessionProgress, DeriveAccountInfo, DeriveHeartbeatAuthor } from '@polkadot/api-derive/types';
import { IValidators } from './account';
import SubstrateChain from './shared';

const MAX_HEADERS = 50;

interface iInfo {
  stash: string;
  balance: number;
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
  public get validators(): Observable<IValidators> {
    return this._Chain.api.pipe(
      switchMap((api: ApiRx) => combineLatest(
        of(api),
        api.derive.staking.validators(),
        api.query.staking.currentEra(),
        api.derive.staking.stashes(),
        api.derive.staking.currentPoints(),
        api.derive.imOnline.receivedHeartbeats()
      )),

      // fetch balances alongside validators
      flatMap((
        [api, { nextElected, validators: currentSet }, era, allStashes, queryPoints, imOnline]:
        [ApiRx, DeriveStakingValidators, EraIndex, AccountId[], EraRewardPoints, Record<string, DeriveHeartbeatAuthor>]
      ) => {
        const eraPoints: Record<string, string> = {};
        const entries = [...queryPoints.individual.entries()]
          .map(([accountId, points]) => [accountId.toString(), formatNumber(points)]);
        entries.forEach(([accountId, points]): void => {
          eraPoints[accountId] = points;
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
          of(imOnline)
        );
      }),
      auditTime(100),
      map(([
        currentSet, toBeElected, controllers, exposures,
        nextUpControllers, nextUpExposures, waiting, eraPoints, imOnline
      ] : [
        AccountId[], AccountId[], Vec<AccountId>, Exposure[],
        Vec<AccountId>, Exposure[], Uint32Array[], Record<string, string>, Record<string, DeriveHeartbeatAuthor>
      ]) => {
        const result: IValidators = {};
        for (let i = 0; i < currentSet.length; ++i) {
          const key = currentSet[i].toString();
          result[key] = {
            exposure: exposures[i],
            controller: controllers[i].toString(),
            isElected: true,
            toBeElected: false,
            eraPoints: eraPoints[key],
            blockCount: imOnline[key]?.blockCount,
            hasMessage: imOnline[key]?.hasMessage,
            isOnline: imOnline[key]?.isOnline
          };
        }
        // add set of next elected
        for (let i = 0; i < toBeElected.length; ++i) {
          const key = toBeElected[i].toString();
          result[key] = {
            exposure: nextUpExposures[i],
            controller: nextUpControllers[i].toString(),
            isElected: false,
            toBeElected: true,
            eraPoints: eraPoints[key],
            blockCount: imOnline[key]?.blockCount,
            hasMessage: imOnline[key]?.hasMessage,
            isOnline: imOnline[key]?.isOnline
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
  public info(address: string): Observable<DeriveAccountInfo> {
    return this._Chain.query((api: ApiRx) => api.derive.accounts.info(address));
  }
  public query(address: string): Observable<DeriveStakingQuery> {
    return this._Chain.query((api: ApiRx) => api.derive.staking.query(address));
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
    return Promise.resolve();
  }
}

export default SubstrateStaking;
