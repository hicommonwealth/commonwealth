import BN from 'bn.js';
import { Near as NearApi, Contract } from 'near-api-js';
import { ITXModalData, ProposalModule } from 'models';
import { NearAccount, NearAccounts } from 'controllers/chain/near/account';
import NearChain from 'controllers/chain/near/chain';
import { notifyError } from 'controllers/app/notifications';
import NearSputnikProposal from './proposal';
import {
  INearSputnikProposal,
  NearSputnikPolicy,
  NearSputnikGetProposalResponse,
  NearSputnikProposalKind,
  isFunctionCall,
} from './types';

export default class NearSputnikDao extends ProposalModule<
  NearApi,
  INearSputnikProposal,
  NearSputnikProposal
> {
  private _Chain: NearChain;
  private _Accounts: NearAccounts;
  private _policy: NearSputnikPolicy;
  public get policy() { return this._policy; }

  private _tokenSupply: BN;
  public get tokenSupply() { return this._tokenSupply; }

  private _nProposals: number;

  // INIT / DEINIT
  public async init(chain: NearChain, accounts: NearAccounts) {
    this._Chain = chain;
    this._Accounts = accounts;
    this._policy = await this.query('get_policy', {});
    this._tokenSupply = new BN(await this.query('delegation_total_supply', {}));
    const res: NearSputnikGetProposalResponse[] = await this.query('get_proposals', { from_index: 0, limit: 100 });
    res.forEach((p) => new NearSputnikProposal(
      this._Chain,
      this._Accounts,
      this,
      { ...p, identifier: `${p.id}` },
    ));
    this._nProposals = +(await this.query('get_last_proposal_id', {}));
    // TODO: support bounties
    this._initialized = true;
  }

  public async query<T>(method: string, args: object): Promise<T> {
    const rawResult = await this._Chain.api.connection.provider.query({
      request_type: 'call_function',
      account_id: this.app.activeChainId(),
      method_name: method,
      args_base64: Buffer.from(JSON.stringify(args)).toString('base64'),
      finality: 'optimistic',
    });
    const res = JSON.parse(Buffer.from((rawResult as any).result).toString());
    return res;
  }

  public deinit() {
    this.store.clear();
  }

  public async proposeTx(description: string, kind: NearSputnikProposalKind) {
    if (typeof kind === 'string') {
      throw new Error(`invalid proposal kind: ${kind}`);
    }

    // TODO: user pre-checks

    const contractId = this.app.activeChainId();
    const methodName = 'add_proposal';
    const args = {
      proposal: {
        description: description.trim(),
        kind,
      },
    };

    const nextProposalId = this._nProposals;
    const callbackUrl = `${window.location.origin}/${contractId}/proposal/sputnikproposal/${nextProposalId}`;
    await this._Chain.redirectTx(contractId, methodName, args, this.policy.proposal_bond, callbackUrl);
  }

  public createTx(...args: any[]): ITXModalData {
    throw new Error('Method not implemented.');
  }
}
