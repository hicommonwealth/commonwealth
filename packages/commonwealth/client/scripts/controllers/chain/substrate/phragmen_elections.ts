import type { ApiPromise } from '@polkadot/api';
import type { u32, Vec } from '@polkadot/types';
import type { BalanceOf } from '@polkadot/types/interfaces';
import type {
  ISubstratePhragmenElection,
  SubstrateCoin,
} from 'adapters/chain/substrate/types';
import type BN from 'bn.js';
import type { ITXModalData } from 'models';
import { ProposalModule } from 'models';
import type SubstrateAccounts from './account';
import type { SubstrateAccount } from './account';
import { SubstratePhragmenElection } from './phragmen_election';
import type SubstrateChain from './shared';

class SubstratePhragmenElections extends ProposalModule<
  ApiPromise,
  ISubstratePhragmenElection,
  SubstratePhragmenElection
> {
  private _candidacyBond: SubstrateCoin = null;
  private _votingBond: SubstrateCoin = null;
  private _desiredMembers: number = null;
  private _desiredRunnersUp: number = null;
  private _termDuration: number = null;

  public get candidacyBond() {
    return this._candidacyBond;
  }

  public get votingBond() {
    return this._votingBond;
  }

  public get desiredMembers() {
    return this._desiredMembers;
  }

  public get desiredRunnersUp() {
    return this._desiredRunnersUp;
  }

  public get termDuration() {
    return this._termDuration;
  }

  protected _activeElection: SubstratePhragmenElection;
  public get activeElection() {
    return this._activeElection;
  }

  public get round() {
    return this._activeElection?.data.round;
  }

  private _members: { [who: string]: BN } = {};
  public get members() {
    return Object.keys(this._members);
  }

  public isMember(who: SubstrateAccount) {
    return !!this._members[who.address];
  }

  public backing(who: SubstrateAccount) {
    return this._Chain.coins(this._members[who.address]);
  }

  private _runnersUp: Array<{ who: string; score: BN }>;
  public get runnersUp() {
    return this._runnersUp.map((r) => r.who);
  }

  public get nextRunnerUp() {
    return this._runnersUp[this._runnersUp.length - 1].who;
  }

  public isRunnerUp(who: SubstrateAccount) {
    return !!this._runnersUp.find((r) => r.who === who.address);
  }

  public runnerUpBacking(who: SubstrateAccount) {
    return this._Chain.coins(
      this._runnersUp.find((r) => r.who === who.address).score || 0
    );
  }

  private _Chain: SubstrateChain;
  private _Accounts: SubstrateAccounts;

  public async init(
    ChainInfo: SubstrateChain,
    Accounts: SubstrateAccounts
  ): Promise<void> {
    this._disabled = !ChainInfo.api.query.elections;
    this._Chain = ChainInfo;
    this._Accounts = Accounts;

    const moduleName = ChainInfo.api.consts.elections
      ? 'elections'
      : ChainInfo.api.consts.phragmenElections
      ? 'phragmenElections'
      : 'electionsPhragmen';

    this._candidacyBond = this._Chain.coins(
      ChainInfo.api.consts[moduleName].candidacyBond as BalanceOf
    );
    this._votingBond = this._Chain.coins(
      ChainInfo.api.consts[moduleName].votingBond as BalanceOf
    );
    this._desiredMembers = +ChainInfo.api.consts[moduleName].desiredMembers;
    this._desiredRunnersUp = +ChainInfo.api.consts[moduleName].desiredRunnersUp;
    this._termDuration = +ChainInfo.api.consts[moduleName].termDuration;
    const members = (await ChainInfo.api.query[
      moduleName
    ].members()) as Vec<any>;
    const runnersUp = (await ChainInfo.api.query[
      moduleName
    ].runnersUp()) as Vec<any>;

    this._runnersUp = runnersUp.map((r) => ({
      who: r.who !== undefined ? r.who.toString() : r[0].toString(),
      // TODO: broken on KLP
      score: r.stake ? r.stake.toBn() : r[1].toBn(),
    }));
    this._members = members.reduce((ms, r) => {
      const who = r.who !== undefined ? r.who : r[0];
      const bal = r.stake !== undefined ? r.stake : r[1];
      ms[who.toString()] = bal.toBn();
      return ms;
    }, {});

    const currentIndex = +(await ChainInfo.api.query[
      moduleName
    ].electionRounds<u32>());
    const blockNumber = await ChainInfo.api.derive.chain.bestNumber();
    const termDuration = +ChainInfo.api.consts[moduleName].termDuration;
    const roundStartBlock =
      Math.floor(+blockNumber / termDuration) * termDuration;
    const endBlock = roundStartBlock + termDuration;
    const p = {
      identifier: `${currentIndex}`,
      round: currentIndex,
      endBlock,
    };
    this._activeElection = new SubstratePhragmenElection(
      ChainInfo,
      Accounts,
      this,
      p,
      moduleName
    );
    this._initialized = true;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public createTx(...args): ITXModalData {
    throw new Error('cannot directly create election');
  }
}

export default SubstratePhragmenElections;
