/* eslint-disable consistent-return */
import BN from 'bn.js';
import { IApp } from 'state';
import { Vec } from '@polkadot/types';
import { ApiRx } from '@polkadot/api';
import { StorageModule } from 'models';
import { StakingStore } from 'stores';
import { formatNumber } from '@polkadot/util';
import { Observable, combineLatest, of } from 'rxjs';
import { map, flatMap, auditTime, switchMap } from 'rxjs/operators';
import { EraIndex, AccountId, Exposure, SessionIndex, EraRewardPoints } from '@polkadot/types/interfaces';
import { InterfaceTypes } from '@polkadot/types/types';
import { DeriveStakingValidators, DeriveStakingElected, DeriveSessionProgress } from '@polkadot/api-derive/types';
import { IValidators } from './account';
import SubstrateChain from './shared';

class SubstrateStaking implements StorageModule {
  private _initialized: boolean = false;

  public get initialized() { return this._initialized; }

  // STORAGE
  private _store = new StakingStore();
  public get store() { return this._store; }

  private _Chain: SubstrateChain;

  private _app: IApp;
  public get app() { return this._app; }

  constructor(app: IApp) {
    this._app = app;
  }
  public createType<K extends keyof InterfaceTypes>(type: K, ...params: any[]): InterfaceTypes[K] {
    return this._Chain.registry.createType(type, ...params);
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
        api.derive.staking.currentPoints()
      )),

      // fetch balances alongside validators
      flatMap((
        [api, { nextElected, validators: currentSet }, era, allStashes, queryPoints]:
        [ApiRx, DeriveStakingValidators, EraIndex, AccountId[], EraRewardPoints]
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
          of(eraPoints)
        );
      }),
      auditTime(100),
      map(([
        currentSet, toBeElected, controllers, exposures,
        nextUpControllers, nextUpExposures, waiting, eraPoints
      ] : [
        AccountId[], AccountId[], Vec<AccountId>, Exposure[],
        Vec<AccountId>, Exposure[], Uint32Array[], Record<string, string>
      ]) => {
        const result: IValidators = {};
        for (let i = 0; i < currentSet.length; ++i) {
          const key = currentSet[i].toString();
          result[key] = {
            exposure: exposures[i],
            controller: controllers[i].toString(),
            isElected: true,
            isWaiting: false,
            eraPoints: eraPoints[key]
          };
        }
        // add set of next elected
        for (let i = 0; i < toBeElected.length; ++i) {
          const key = toBeElected[i].toString();
          result[key] = {
            exposure: nextUpExposures[i],
            controller: nextUpControllers[i].toString(),
            isElected: false,
            isWaiting: false,
            eraPoints: eraPoints[key]
          };
        }
        // add set of waiting validators
        for (let i = 0; i < waiting.length; ++i) {
          const key = waiting[i].toString();
          result[key] = {
            exposure: null,
            controller: null,
            isElected: false,
            isWaiting: true,
            eraPoints: eraPoints[key]
          };
        }

        return result;
      }),
    );
  }
  public info(address: string): Observable<any> {
    return this._Chain.query((api: ApiRx) => api.derive.accounts.info(address));
  }
  public query(address: string): Observable<any> {
    return this._Chain.query((api: ApiRx) => api.derive.staking.query(address));
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
