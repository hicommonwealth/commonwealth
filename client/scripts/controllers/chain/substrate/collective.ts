import { first } from 'rxjs/operators';
import { ApiRx } from '@polkadot/api';
import { Call, AccountId } from '@polkadot/types/interfaces';
import { ISubstrateCollectiveProposal } from 'adapters/chain/substrate/types';
import { SubstrateTypes } from '@commonwealth/chain-events';
import { ProposalModule } from 'models';
import { Unsubscribable } from 'rxjs';
import { Vec } from '@polkadot/types';
import SubstrateChain from './shared';
import SubstrateAccounts, { SubstrateAccount } from './account';
import { SubstrateCollectiveProposal } from './collective_proposal';

class SubstrateCollective extends ProposalModule<
  ApiRx,
  ISubstrateCollectiveProposal,
  SubstrateCollectiveProposal
> {
  private _memberSubscription: Unsubscribable; // init in each overriden init() call
  private _members: SubstrateAccount[];
  public get members() { return this._members; }
  public isMember(account: SubstrateAccount): boolean {
    return this._members.find((m) => m.address === account.address) !== undefined;
  }

  private _moduleName: string;
  public get moduleName() { return this._moduleName; }

  private _Chain: SubstrateChain;
  private _Accounts: SubstrateAccounts;

  // TODO: we may want to track membership here as well as in elections
  public init(ChainInfo: SubstrateChain, Accounts: SubstrateAccounts, moduleName: string): Promise<void> {
    this._Chain = ChainInfo;
    this._Accounts = Accounts;
    this._moduleName = moduleName;
    return new Promise((resolve, reject) => {
      const entities = this.app.chain.chainEntities.store.getByType(SubstrateTypes.EntityKind.CollectiveProposal);
      const constructorFunc = (e) => new SubstrateCollectiveProposal(this._Chain, this._Accounts, this, e);
      const proposals = entities.map((e) => this._entityConstructor(constructorFunc, e));

      this._Chain.api.pipe(first()).subscribe((api: ApiRx) => {
        const memberP = new Promise((memberResolve) => {
          this._memberSubscription = api.query[moduleName].members().subscribe((members: Vec<AccountId>) => {
            this._members = members.toArray().map((v) => this._Accounts.fromAddress(v.toString()));
            memberResolve();
          });
        }).then(() => {
          this._initialized = true;
          resolve();
        }).catch((err) => {
          reject(err);
        });
      });
    });
  }

  public createEmergencyCancellation(author: SubstrateAccount, threshold: number, referendumId: number) {
    const func = this._Chain.getTxMethod('democracy', 'emergencyCancel');
    return this.createTx(author, threshold, func(referendumId).method, func(referendumId).method.encodedLength);
  }
  public vetoNextExternal(author: SubstrateAccount, hash: string) {
    const func = this._Chain.getTxMethod('democracy', 'vetoExternal');
    return this.createTx(author, 1, func(hash).method, func(hash).encodedLength);
  }
  public createTreasuryApprovalMotion(author: SubstrateAccount, threshold: number, treasuryIdx: number) {
    const func = this._Chain.getTxMethod('treasury', 'approveProposal');
    return this.createTx(author, threshold, func(treasuryIdx).method, func(treasuryIdx).encodedLength);
  }
  public createTreasuryRejectionMotion(author: SubstrateAccount, threshold: number, treasuryIdx: number) {
    const func = this._Chain.getTxMethod('treasury', 'rejectProposal');
    return this.createTx(author, threshold, func(treasuryIdx).method, func(treasuryIdx).method.encodedLength);
  }
  public createExternalProposal(author: SubstrateAccount, threshold: number, action: Call, length: number) {
    const func = this._Chain.getTxMethod('democracy', 'externalPropose');
    return this.createTx(author, threshold, func(action.hash).method, length);
  }
  public createExternalProposalMajority(author: SubstrateAccount, threshold: number, action: Call, length) {
    const func = this._Chain.getTxMethod('democracy', 'externalProposeMajority');
    return this.createTx(author, threshold, func(action.hash).method, length);
  }
  public createExternalProposalDefault(author: SubstrateAccount, threshold: number, action: Call, length) {
    // only on kusama
    const func = this._Chain.getTxMethod('democracy', 'externalProposeDefault');
    return this.createTx(author, threshold, func(action.hash).method, length);
  }
  public createFastTrack(
    author: SubstrateAccount,
    threshold: number,
    hash: string,
    votingPeriod: number,
    delay: number
  ) {
    // only on kusama
    // TODO: we must check if Instant is allowed and if
    // votingPeriod is valid wrt FastTrackVotingPeriod
    const func = (this._Chain.getTxMethod('democracy', 'fastTrack'));
    return this.createTx(
      author,
      threshold,
      func(hash, votingPeriod, delay).method,
      func(hash, votingPeriod, delay).method.encodedLength
    );
  }

  public createTx(author: SubstrateAccount, threshold: number, action: Call, length?: number, fromTechnicalCommittee?: boolean) {
    // TODO: check council status
    const title = this._Chain.methodToTitle(action);
    const txFunc = fromTechnicalCommittee
      ? ((api: ApiRx) => api.tx.technicalCommittee.propose.meta.args.length === 3 ?
          api.tx.technicalCommittee.propose(threshold, action, length) : 
            api.tx.technicalCommittee.propose(threshold, action))
        : ((api: ApiRx) => api.tx.council.propose.meta.args.length === 3 ?
        api.tx.council.propose(threshold, action, length) : 
          api.tx.council.propose(threshold, action, null));
    return this._Chain.createTXModalData(
      author,
      txFunc,
      'createCouncilMotion',
      title
    );
  }

  public deinit() {
    if (this._memberSubscription) {
      this._memberSubscription.unsubscribe();
    }
    super.deinit();
  }
}

export class SubstrateCouncil extends SubstrateCollective {
  public init(ChainInfo: SubstrateChain, Accounts: SubstrateAccounts): Promise<void> {
    return super.init(ChainInfo, Accounts, 'council');
  }
}

export class SubstrateTechnicalCommittee extends SubstrateCollective {
  public init(ChainInfo: SubstrateChain, Accounts: SubstrateAccounts): Promise<void> {
    return super.init(ChainInfo, Accounts, 'technicalCommittee');
  }
}

export default SubstrateCollective;
