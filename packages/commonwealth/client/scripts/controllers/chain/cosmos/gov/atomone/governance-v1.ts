import { Any, numberToLong } from '@hicommonwealth/chains';
import type {
  CosmosToken,
  ICosmosProposal,
} from 'controllers/chain/cosmos/types';
import ProposalModule from 'models/ProposalModule';
import { ITXModalData } from 'models/interfaces';
import type CosmosAccount from '../../account';
import type CosmosAccounts from '../../accounts';
import type CosmosChain from '../../chain';
import type { CosmosApiType } from '../../chain';
import { CosmosProposalV1AtomOne } from './proposal-v1';
import { encodeMsgSubmitProposal, propToIProposal } from './utils-v1';

/** This file is a copy of controllers/chain/cosmos/governance.ts, modified for
 * gov module version v1. This is considered a patch to make sure v1-enabled chains
 * load proposals. Eventually we will ideally move back to one governance.ts file.
 * Patch state:
 *
 * - governance.ts uses cosmJS v1beta1 gov
 * - governance-v1.ts uses telescope-generated v1 gov  */
class CosmosGovernanceV1AtomOne extends ProposalModule<
  CosmosApiType,
  ICosmosProposal,
  // @ts-expect-error StrictNullChecks
  CosmosProposalV1AtomOne
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

  public async getProposal(
    proposalId: number,
  ): Promise<CosmosProposalV1AtomOne> {
    const existingProposal = this.store.getByIdentifier(proposalId);
    if (existingProposal) {
      return existingProposal;
    }
    return this._initProposal(proposalId);
  }

  // @ts-expect-error StrictNullChecks
  private async _initProposal(proposalId: number): Promise<CosmosProposalV1> {
    try {
      // @ts-expect-error StrictNullChecks
      if (!proposalId) return;
      const { proposal } = await this._Chain.lcd.atomone.gov.v1.proposal({
        proposalId: numberToLong(proposalId),
      });
      const cosmosProposal = new CosmosProposalV1AtomOne(
        this._Chain,
        this._Accounts,
        this,
        // @ts-expect-error StrictNullChecks
        propToIProposal(proposal),
      );
      await cosmosProposal.init();
      return cosmosProposal;
    } catch (error) {
      console.error('Error fetching proposal: ', error);
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
    const submitEvent = events?.find((e) => e.type === 'submit_proposal');
    const cosm = await import('@cosmjs/encoding');
    const idAttribute = submitEvent?.attributes.find(
      ({ key }) => key && cosm.fromAscii(key) === 'proposal_id',
    );
    // @ts-expect-error StrictNullChecks
    const id = +cosm.fromAscii(idAttribute.value);
    await this._initProposal(id);
    return id;
  }
}

export default CosmosGovernanceV1AtomOne;
