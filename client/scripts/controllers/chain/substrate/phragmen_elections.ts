import { ProposalModule, ITXModalData, ChainEntity } from 'models';
import { ApiRx } from '@polkadot/api';
import {
  ISubstratePhragmenElection,
  ISubstratePhragmenElectionState,
  SubstrateCoin
} from 'adapters/chain/substrate/types';
import { first, flatMap, map } from 'rxjs/operators';
import { Unsubscribable } from 'rxjs';
import BN from 'bn.js';
import { BalanceOf, AccountId, BlockNumber } from '@polkadot/types/interfaces';
import { Codec } from '@polkadot/types/types';
import { Vec, u32 } from '@polkadot/types';
import SubstrateChain from './shared';
import SubstrateAccounts, { SubstrateAccount } from './account';
import { SubstratePhragmenElection } from './phragmen_election';

type ElectionResultCodec = [ AccountId, BalanceOf ] & Codec;

class SubstratePhragmenElections extends ProposalModule<
  ApiRx,
  ISubstratePhragmenElection,
  SubstratePhragmenElection
> {
  private _candidacyBond: SubstrateCoin = null;
  private _votingBond: SubstrateCoin = null;
  private _desiredMembers: number = null;
  private _desiredRunnersUp: number = null;
  private _termDuration: number = null;
  public get candidacyBond() { return this._candidacyBond; }
  public get votingBond() { return this._votingBond; }
  public get desiredMembers() { return this._desiredMembers; }
  public get desiredRunnersUp() { return this._desiredRunnersUp; }
  public get termDuration() { return this._termDuration; }

  protected _activeElection: SubstratePhragmenElection;
  public get activeElection() { return this._activeElection; }
  public get round() { return this._activeElection.data.round; }

  private _memberSubscription: Unsubscribable;

  private _members: { [who: string]: BN };
  public get members() { return Object.keys(this._members); }
  public isMember(who: SubstrateAccount) { return !!this._members[who.address]; }
  public backing(who: SubstrateAccount) { return this._Chain.coins(this._members[who.address]); }

  private _runnersUp: Array<{ who: string, score: BN }>;
  public get runnersUp() { return this._runnersUp.map((r) => r.who); }
  public get nextRunnerUp() { return this._runnersUp[this._runnersUp.length - 1].who; }
  public isRunnerUp(who: SubstrateAccount) { return !!this._runnersUp.find((r) => r.who === who.address); }
  public runnerUpBacking(who: SubstrateAccount) { return !!this._runnersUp.find((r) => r.who === who.address).score; }

  private _Chain: SubstrateChain;
  private _Accounts: SubstrateAccounts;

  public deinit() {
    if (this._memberSubscription) {
      this._memberSubscription.unsubscribe();
    }
    super.deinit();
  }

  public init(ChainInfo: SubstrateChain, Accounts: SubstrateAccounts): Promise<void> {
    this._Chain = ChainInfo;
    this._Accounts = Accounts;
    return new Promise((resolve, reject) => {
      this._Chain.api.pipe(first()).subscribe(async (api: ApiRx) => {
        const moduleName = api.consts.elections
          ? 'elections'
          : api.consts.phragmenElections
            ? 'phragmenElections'
            : 'electionsPhragmen';

        this._candidacyBond = this._Chain.coins(api.consts[moduleName].candidacyBond as BalanceOf);
        this._votingBond = this._Chain.coins(api.consts[moduleName].votingBond as BalanceOf);
        this._desiredMembers = +api.consts[moduleName].desiredMembers;
        this._desiredRunnersUp = +api.consts[moduleName].desiredRunnersUp;
        this._termDuration = +api.consts[moduleName].termDuration;

        await new Promise((memberResolve) => {
          this._memberSubscription = api.queryMulti([
            [ api.query[moduleName].members ],
            [ api.query[moduleName].runnersUp ]
          ]).subscribe(([ members, runnersUp ]: [ Vec<ElectionResultCodec>, Vec<ElectionResultCodec> ]) => {
            this._runnersUp = runnersUp.map(([ who, bal ]) => ({ who: who.toString(), score: bal.toBn() }));
            this._members = members.reduce((ms, [ who, bal ]) => {
              ms[who.toString()] = bal.toBn();
              return ms;
            }, {});
            memberResolve();
          });
        });

        let currentIndex: number;
        await new Promise((roundResolve) => {
          api.query[moduleName].electionRounds<u32>().pipe(
            // take current block number to determine when round ends
            flatMap((voteIndex: u32) => {
              currentIndex = +voteIndex;
              return api.derive.chain.bestNumber();
            }),
            first(),
            map((blockNumber: BlockNumber) => {
              const termDuration = +api.consts[moduleName].termDuration;
              const roundStartBlock = Math.floor((+blockNumber) / termDuration) * termDuration;
              const endBlock = roundStartBlock + termDuration;
              return [{
                identifier: `${currentIndex}`,
                round: currentIndex,
                endBlock,
              }];
            }),
          ).subscribe(([ p ]) => {
            this._activeElection = new SubstratePhragmenElection(ChainInfo, Accounts, this, p, moduleName);
            roundResolve();
          });
        });

        this._initialized = true;
        resolve();
      });
    });
  }

  public createTx(...args): ITXModalData {
    throw new Error('cannot directly create election');
  }
}

export default SubstratePhragmenElections;
