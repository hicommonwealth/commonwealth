import { first } from 'rxjs/operators';
import { ApiRx } from '@polkadot/api';
import { Vote as SrmlVote, BlockNumber } from '@polkadot/types/interfaces';
import { ISubstrateDemocracyReferendum, SubstrateCoin } from 'adapters/chain/substrate/types';
import { ITXModalData, ProposalModule, ChainEntity } from 'models';
import { SubstrateEntityKind } from 'events/edgeware/types';
import SubstrateChain from './shared';
import SubstrateAccounts, { SubstrateAccount } from './account';
import { SubstrateDemocracyReferendum } from './democracy_referendum';

class SubstrateDemocracy extends ProposalModule<
  ApiRx,
  ISubstrateDemocracyReferendum,
  SubstrateDemocracyReferendum
> {
  private _enactmentPeriod: number = null;
  private _cooloffPeriod: number = null;
  private _votingPeriod: number = null;
  private _emergencyVotingPeriod: number = null;
  private _preimageByteDeposit: SubstrateCoin = null;
  get enactmentPeriod() { return this._enactmentPeriod; }
  get cooloffPeriod() { return this._cooloffPeriod; }
  get votingPeriod() { return this._votingPeriod; }
  get emergencyVotingPeriod() { return this._emergencyVotingPeriod; }
  get preimageByteDeposit() { return this._preimageByteDeposit; }

  private _Chain: SubstrateChain;
  private _Accounts: SubstrateAccounts;
  private _useRedesignLogic: boolean;
  public get isRedesignLogic() { return this._useRedesignLogic; }

  public getByHash(hash: string) {
    return this.store.getAll().find((referendum) => referendum.hash === hash);
  }

  // Loads all proposals and referendums currently present in the democracy module
  public init(ChainInfo: SubstrateChain, Accounts: SubstrateAccounts, useRedesignLogic: boolean): Promise<void> {
    this._Chain = ChainInfo;
    this._Accounts = Accounts;
    this._useRedesignLogic = useRedesignLogic;
    return new Promise((resolve, reject) => {
      const entities = this.app.chainEntities.store.getByType(SubstrateEntityKind.DemocracyReferendum);
      const constructorFunc = (e) => new SubstrateDemocracyReferendum(this._Chain, this._Accounts, this, e);
      const proposals = entities.map((e) => this._entityConstructor(constructorFunc, e));

      this._Chain.api.pipe(first()).subscribe((api: ApiRx) => {
        // save parameters
        this._enactmentPeriod = +(api.consts.democracy.enactmentPeriod as BlockNumber);
        this._cooloffPeriod = +(api.consts.democracy.cooloffPeriod as BlockNumber);
        this._votingPeriod = +(api.consts.democracy.votingPeriod as BlockNumber);
        this._emergencyVotingPeriod = +(api.consts.democracy.emergencyVotingPeriod as BlockNumber);
        this._preimageByteDeposit = this._Chain.coins(api.consts.democracy.preimageByteDeposit);

        this._initialized = true;
        resolve();
      });
    });
  }

  public reapPreimage(author: SubstrateAccount, hash: string) {
    // TODO: verify that hash corresponds to an actual preimage & is in a reap-able state
    return this._Chain.createTXModalData(
      author,
      (api: ApiRx) => api.tx.democracy.reapPreimage(hash),
      'reapPreimage',
      `Preimage hash: ${hash}`,
    );
  }

  /*
  * Proxying and Delegation currently unsupported...
  * If we decide to support them, we'll update the controllers.

  public async setProxyTx(who: SubstrateAccount, proxy: SubstrateAccount) {
    const proxyFor = await proxy.proxyFor.pipe(first()).toPromise();
    if (proxyFor) {
      throw new Error('already a proxy');
    }
    return this._Chain.createTXModalData(
      who,
      (api: ApiRx) => api.tx.democracy.setProxy(proxy.address),
      'setProxy',
      `${who.address} sets proxy to ${proxy.address}`
    );
  }

  public async resignProxyTx(who: SubstrateAccount) {
    const proxyFor = await who.proxyFor.pipe(first()).toPromise();
    if (proxyFor) {
      throw new Error('not a proxy');
    }
    return this._Chain.createTXModalData(
      who,
      (api: ApiRx) => api.tx.democracy.resignProxy(),
      'resignProxy',
      `${who.address} resigns as proxy`
    );
  }

  public async removeProxyTx(who: SubstrateAccount, proxy: SubstrateAccount) {
    const proxyFor = await proxy.proxyFor.pipe(first()).toPromise();
    if (!proxyFor) {
      throw new Error('not a proxy');
    }
    return this._Chain.createTXModalData(
      who,
      (api: ApiRx) => api.tx.democracy.removeProxy(proxy.address),
      'removeProxy',
      `${who.address} removes proxy ${proxy.address}`
    );
  }

  public delegateTx(who: SubstrateAccount, toAccount: SubstrateAccount, conviction: Conviction) {
    return this._Chain.createTXModalData(
      who,
      (api: ApiRx) => api.tx.democracy.delegate(toAccount.address, conviction),
      'delegate',
      `${who.address} delegates to ${toAccount.address}`
    );
  }

  public undelegateTx(who: SubstrateAccount) {
    if (!who.delegation) {
      throw new Error('Account not delegated');
    }
    return this._Chain.createTXModalData(
      who,
      (api: ApiRx) => api.tx.democracy.undelegate(),
      'undelegate',
      `undelegating ${who.address}`
    );
  }
  */

  public createTx(...args): ITXModalData {
    throw new Error('cannot directly create democracy referendum');
  }
}

export default SubstrateDemocracy;
