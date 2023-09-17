import { Any } from 'cosmjs-types/google/protobuf/any';

import type { ICosmosProposal } from 'controllers/chain/cosmos/types';
import { CosmosToken } from 'controllers/chain/cosmos/types';
import type { ITXModalData } from 'models/interfaces';
import ProposalModule from 'models/ProposalModule';
import type CosmosAccount from '../../account';
import type CosmosAccounts from '../../accounts';
import type CosmosChain from '../../chain';
import type { CosmosApiType } from '../../chain';
import { CosmosProposal } from './proposal-v1beta1';
import { encodeMsgSubmitProposal, msgToIProposal } from './utils-v1beta1';

/* CosmosGovernance v1beta1 */

class CosmosGovernance extends ProposalModule<
  CosmosApiType,
  ICosmosProposal,
  CosmosProposal
> {
  private _minDeposit: CosmosToken;
  public get minDeposit() {
    return this._minDeposit;
  }

  public setMinDeposit(minDeposit: CosmosToken) {
    this._minDeposit = minDeposit;
  }

  private _Chain: CosmosChain;
  private _Accounts: CosmosAccounts;

  public async init(
    ChainInfo: CosmosChain,
    Accounts: CosmosAccounts
  ): Promise<void> {
    this._Chain = ChainInfo;
    this._Accounts = Accounts;
    this._initialized = true;
  }

  public async getProposal(proposalId: number): Promise<CosmosProposal> {
    const existingProposal = this.store.getByIdentifier(proposalId);
    if (existingProposal) return existingProposal;
    return this._initProposal(proposalId);
  }

  private async _initProposal(proposalId: number): Promise<CosmosProposal> {
    try {
      if (!proposalId) return;
      const { proposal } = await this._Chain.api.gov.proposal(proposalId);
      const cosmosProposal = new CosmosProposal(
        this._Chain,
        this._Accounts,
        this,
        msgToIProposal(proposal)
      );
      cosmosProposal.init();
      return cosmosProposal;
    } catch (e) {
      console.error('Error fetching proposal: ', e);
    }
  }

  public createTx(
    sender: CosmosAccount,
    title: string,
    description: string,
    initialDeposit: CosmosToken,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    memo = ''
  ): ITXModalData {
    throw new Error('unsupported');
  }

  // TODO: support multiple deposit types
  public async submitProposalTx(
    sender: CosmosAccount,
    initialDeposit: CosmosToken,
    content: Any
  ): Promise<number> {
    const msg = encodeMsgSubmitProposal(
      sender.address,
      initialDeposit,
      content
    );

    // fetch completed proposal from returned events
    const events = await this._Chain.sendTx(sender, msg);
    console.log(events);
    const submitEvent = events.find((e) => e.type === 'submit_proposal');
    const cosm = await import('@cosmjs/encoding');
    const idAttribute = submitEvent.attributes.find(
      ({ key }) => cosm.fromAscii(key) === 'proposal_id'
    );
    const id = +cosm.fromAscii(idAttribute.value);
    await this._initProposal(id);
    return id;
  }
}

export default CosmosGovernance;
