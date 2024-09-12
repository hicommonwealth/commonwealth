import { Any } from 'cosmjs-types/google/protobuf/any';

import type { ICosmosProposal } from 'controllers/chain/cosmos/types';
import { CosmosToken } from 'controllers/chain/cosmos/types';
import ProposalModule from 'models/ProposalModule';
import type { ITXModalData } from 'models/interfaces';
import type CosmosAccount from '../../account';
import type CosmosAccounts from '../../accounts';
import type CosmosChain from '../../chain';
import type { CosmosApiType } from '../../chain';
import { CosmosProposalGovgen } from './proposal-v1beta1';
import { encodeMsgSubmitProposal, msgToIProposal } from './utils-v1beta1';

/* CosmosGovernance v1beta1 */

class CosmosGovernanceGovgen extends ProposalModule<
  CosmosApiType,
  ICosmosProposal,
  // @ts-expect-error StrictNullChecks
  CosmosProposalGovgen
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

  /* eslint-disable-next-line @typescript-eslint/require-await */
  public async init(
    ChainInfo: CosmosChain,
    Accounts: CosmosAccounts,
  ): Promise<void> {
    this._Chain = ChainInfo;
    this._Accounts = Accounts;
    this._initialized = true;
  }

  public async getProposal(proposalId: number): Promise<CosmosProposalGovgen> {
    const existingProposal = this.store.getByIdentifier(proposalId);
    if (existingProposal) return existingProposal;
    return this._initProposal(proposalId);
  }

  private async _initProposal(
    proposalId: number,
    // @ts-expect-error StrictNullChecks
  ): Promise<CosmosProposalGovgen> {
    try {
      // @ts-expect-error StrictNullChecks
      if (!proposalId) return;
      const { proposal } = await this._Chain.api.govgen.proposal(proposalId);
      const cosmosProposal = new CosmosProposalGovgen(
        this._Chain,
        this._Accounts,
        this,
        // @ts-expect-error StrictNullChecks
        msgToIProposal(proposal),
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
    memo = '',
  ): ITXModalData {
    throw new Error('unsupported');
  }

  // TODO: support multiple deposit types
  public async submitProposalTx(
    sender: CosmosAccount,
    initialDeposit: CosmosToken,
    content: Any,
  ): Promise<number> {
    const msg = encodeMsgSubmitProposal(
      sender.address,
      initialDeposit,
      content,
    );

    // fetch completed proposal from returned events
    const events = await this._Chain.sendTx(sender, msg);
    console.log(events);
    const submitEvent = events.find((e) => e.type === 'submit_proposal');
    const cosm = await import('@cosmjs/encoding');
    // @ts-expect-error StrictNullChecks
    const idAttribute = submitEvent.attributes.find(
      ({ key }) => cosm.fromAscii(key) === 'proposal_id',
    );
    // @ts-expect-error StrictNullChecks
    const id = +cosm.fromAscii(idAttribute.value);
    await this._initProposal(id);
    return id;
  }
}

export default CosmosGovernanceGovgen;
