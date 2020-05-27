/* eslint-disable consistent-return */
import BN from 'bn.js';
import { IApp } from 'state';
import { Vec } from '@polkadot/types';
import { ApiRx } from '@polkadot/api';
import { Observable, combineLatest, of } from 'rxjs';
import { map, flatMap, auditTime, switchMap } from 'rxjs/operators';
import { EraIndex, AccountId, Exposure, SessionIndex } from '@polkadot/types/interfaces';
import { DeriveStakingValidators, DeriveStakingElected, DeriveSessionProgress } from '@polkadot/api-derive/types';
import SubstrateAccounts, { IValidatorInfo, IValidators } from './account';

class SubstrateStaking extends SubstrateAccounts {
  constructor(app: IApp) {
    super(app);
  }
  public get validatorCount(): Observable<SessionIndex> {
    return this._Chain.query((api: ApiRx) => api.query.staking.validatorCount())
      .pipe(map((count) => count));
  }
  public get sessionInfo(): Observable<DeriveSessionProgress> {
    return this._Chain.query((api: ApiRx) => api.derive.session.progress())
      .pipe(map((res) => res));
  }
  public get validators(): Observable<IValidators> {
    return this._Chain.api.pipe(
      switchMap((api: ApiRx) => combineLatest(
        of(api),
        api.derive.staking.validators(),
        api.query.staking.currentEra(),
        api.derive.staking.electedInfo(),
        api.derive.staking.stashes()
      )),

      // fetch balances alongside validators
      flatMap((
        [api, { nextElected, validators: currentSet }, era, electedInfo, allStashes]:
        [ApiRx, DeriveStakingValidators, EraIndex, DeriveStakingElected, any]
      ) => {
        // set of not yet but future validators
        const waiting = allStashes.filter((v) => !currentSet.includes(v));
        const toBeElected = nextElected.filter((v) => !currentSet.includes(v));
        const validatorsInfo: IValidatorInfo = {};

        electedInfo.info.forEach(({ accountId, validatorPrefs }) => {
          const commissionPer = (validatorPrefs.commission.unwrap() || new BN(0)).toNumber() / 10_000_000;
          const isCommission = !!validatorPrefs.commission;
          const key = accountId.toString();
          const details = {
            commissionPer,
            isCommission
          };
          validatorsInfo[key] = details;
          return details;
        });

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
          of(validatorsInfo),
          of(waiting)
        );
      }),
      auditTime(100),
      map(([
        currentSet, toBeElected, controllers, exposures, nextUpControllers, nextUpExposures, validatorsInfo, waiting
      ] : [
        AccountId[], AccountId[], Vec<AccountId>, Exposure[], Vec<AccountId>, Exposure[], IValidatorInfo, Uint32Array[]
      ]) => {
        const result: IValidators = {};
        for (let i = 0; i < currentSet.length; ++i) {
          const key = currentSet[i].toString();
          result[key] = {
            exposure: exposures[i],
            controller: controllers[i].toString(),
            isElected: true,
            isWaiting: false,
            commissionPer: validatorsInfo[key]
              ? validatorsInfo[key].commissionPer
              : 0
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
            commissionPer: validatorsInfo[key]
              ? validatorsInfo[key].commissionPer
              : 0
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
            commissionPer: validatorsInfo[key]
              ? validatorsInfo[key].commissionPer
              : 0
          };
        }
        // add set of waiting validators
        for (let i = 0; i < waiting.length; ++i) {
          const key = waiting[i].toString();
          result[key] = {
            exposure: null,
            controller: 'controller',
            isElected: false,
            isWaiting: true,
            commissionPer: 0
          };
        }

        return result;
      }),
    );
  }

  public info(address: string): Observable<any> {
    // console.log(' getinfo  ', address);
    return this._Chain.query((api: ApiRx) => api.derive.accounts.info(address))
      .pipe(
        map((info) => info)
      );
  }
  public query(address: string): Observable<any> {
    // console.log(' getinfo  ', address);
    return this._Chain.query((api: ApiRx) => api.derive.staking.query(address))
      .pipe(
        map((info) => info)
      );
  }
}

export default SubstrateStaking;
