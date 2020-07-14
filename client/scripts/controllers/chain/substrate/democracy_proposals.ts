import { Unsubscribable } from 'rxjs';
import { first } from 'rxjs/operators';
import { Codec } from '@polkadot/types/types';
import { BlockNumber, Call, Balance, VoteThreshold, Hash } from '@polkadot/types/interfaces';
import { bool, Option } from '@polkadot/types';
import { ApiRx } from '@polkadot/api';
import { ISubstrateDemocracyProposal, SubstrateCoin } from 'adapters/chain/substrate/types';
import { SubstrateEntityKind } from 'commonwealth-chain-events/dist/src/substrate/types';
import { ProposalModule } from 'models';
import SubstrateChain from './shared';
import SubstrateAccounts, { SubstrateAccount } from './account';
import SubstrateDemocracyProposal from './democracy_proposal';

type NextExternal = [Hash, VoteThreshold] & Codec;

class SubstrateDemocracyProposals extends ProposalModule<
  ApiRx,
  ISubstrateDemocracyProposal,
  SubstrateDemocracyProposal
> {
  // SubstrateDemocracyProposals DATA
  // How often (in blocks) new public referenda are launched.
  private _launchPeriod: number = null;

  get launchPeriod() { return this._launchPeriod; }

  // Period in blocks where an external proposal may not be re-submitted after being vetoed.
  private _cooloffPeriod: number = null;

  get cooloffPeriod() { return this._cooloffPeriod; }

  // The minimum amount to be used as a deposit for a public referendum proposal.
  private _minimumDeposit: SubstrateCoin = null;

  get minimumDeposit() { return this._minimumDeposit; }

  get nextLaunchBlock(): number {
    return (Math.floor(this.app.chain.block.height / this.launchPeriod) + 1) * this.launchPeriod;
  }

  private _lastTabledWasExternal: boolean = null;

  get lastTabledWasExternal() { return this._lastTabledWasExternal; }

  private _nextExternal: [ Hash, VoteThreshold ] = null;

  get nextExternal() { return this._nextExternal; }

  private _externalsSubscription: Unsubscribable;

  private _Chain: SubstrateChain;

  private _Accounts: SubstrateAccounts;

  public getByHash(hash: string) {
    return this.store.getAll().find((proposal) => proposal.hash === hash);
  }

  // Loads all proposals and referendums currently present in the democracy module
  public init(ChainInfo: SubstrateChain, Accounts: SubstrateAccounts): Promise<void> {
    this._Chain = ChainInfo;
    this._Accounts = Accounts;
    return new Promise((resolve, reject) => {
      const entities = this.app.chain.chainEntities.store.getByType(SubstrateEntityKind.DemocracyProposal);
      const constructorFunc = (e) => new SubstrateDemocracyProposal(this._Chain, this._Accounts, this, e);
      const proposals = entities.map((e) => this._entityConstructor(constructorFunc, e));

      this._Chain.api.pipe(first()).subscribe((api: ApiRx) => {
        // save parameters
        this._minimumDeposit = this._Chain.coins(api.consts.democracy.minimumDeposit as Balance);
        this._launchPeriod = +(api.consts.democracy.launchPeriod as BlockNumber);
        this._cooloffPeriod = +(api.consts.democracy.cooloffPeriod as BlockNumber);

        // TODO: add preimage to get name
        const externalsP = new Promise((externalsResolve) => {
          this._externalsSubscription = api.queryMulti([
            api.query.democracy.lastTabledWasExternal,
            api.query.democracy.nextExternal,
          ]).subscribe(([lastTabledWasExternal, nextExternal]: [ bool, Option<NextExternal> ]) => {
            this._lastTabledWasExternal = lastTabledWasExternal.valueOf();
            this._nextExternal = nextExternal.unwrapOr(null);
            externalsResolve();
          });
        }).then(() => {
          this._initialized = true;
          resolve();
        }).catch((err) => {
          reject(err);
        });
      },
      (err) => reject(new Error(err)));
    });
  }

  public deinit() {
    if (this._externalsSubscription) {
      this._externalsSubscription.unsubscribe();
    }
    super.deinit();
  }

  public async createTx(author: SubstrateAccount, action: Call, proposalHash: Hash, deposit: SubstrateCoin) {
    if (deposit.lt(this.minimumDeposit)) {
      throw new Error(`deposit must be greater than ${+this.minimumDeposit}`);
    }

    const txFunc = (api: ApiRx) => api.tx.democracy.propose(proposalHash, deposit.asBN);
    if (!(await this._Chain.canPayFee(author, txFunc, deposit))) {
      throw new Error('insufficient funds');
    }

    const title = this._Chain.methodToTitle(action);
    return this._Chain.createTXModalData(author, txFunc, 'createDemocracyProposal', title);
  }

  public notePreimage(author: SubstrateAccount, action: Call, encodedProposal: string) {
    const title = this._Chain.methodToTitle(action);
    return this._Chain.createTXModalData(
      author,
      (api: ApiRx) => api.tx.democracy.notePreimage(encodedProposal),
      'notePreimage',
      title
    );
  }

  public noteImminentPreimage(author: SubstrateAccount, action: Call, encodedProposal: string) {
    const title = this._Chain.methodToTitle(action);
    return this._Chain.createTXModalData(
      author,
      (api: ApiRx) => api.tx.democracy.notePreimage(encodedProposal),
      'noteImminentPreimage',
      title,
    );
  }
}

export default SubstrateDemocracyProposals;
