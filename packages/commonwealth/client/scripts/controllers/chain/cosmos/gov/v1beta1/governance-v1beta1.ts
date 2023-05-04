import BN from 'bn.js';
import { CommunityPoolSpendProposal } from 'cosmjs-types/cosmos/distribution/v1beta1/distribution';
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
import {
  asciiLiteralToDecimal,
  encodeMsgSubmitProposal,
  getActiveProposalsV1Beta1,
  msgToIProposal,
} from './utils-v1beta1';

/* AKA CosmosGovernance v1beta1 */

class CosmosGovernance extends ProposalModule<
  CosmosApiType,
  ICosmosProposal,
  CosmosProposal
> {
  private _votingPeriodS: number;
  private _yesThreshold: number;
  private _vetoThreshold: number;
  private _maxDepositPeriodS: number;
  private _minDeposit: CosmosToken;

  public get vetoThreshold() {
    return this._vetoThreshold;
  }

  public get minDeposit() {
    return this._minDeposit;
  }

  private _Chain: CosmosChain;
  private _Accounts: CosmosAccounts;

  public async init(
    ChainInfo: CosmosChain,
    Accounts: CosmosAccounts
  ): Promise<void> {
    this._Chain = ChainInfo;
    this._Accounts = Accounts;

    // query chain-wide params
    const { depositParams } = await this._Chain.api.gov.params('deposit');
    const { tallyParams } = await this._Chain.api.gov.params('tallying');
    const { votingParams } = await this._Chain.api.gov.params('voting');
    this._votingPeriodS = votingParams.votingPeriod.seconds.toNumber();
    this._yesThreshold = await asciiLiteralToDecimal(tallyParams.threshold);
    this._vetoThreshold = await asciiLiteralToDecimal(
      tallyParams.vetoThreshold
    );
    this._maxDepositPeriodS = depositParams.maxDepositPeriod.seconds.toNumber();

    // TODO: support off-denom deposits
    const depositCoins = depositParams.minDeposit.find(
      ({ denom }) => denom === this._Chain.denom
    );
    if (depositCoins) {
      this._minDeposit = new CosmosToken(
        depositCoins.denom,
        new BN(depositCoins.amount)
      );
    } else {
      console.error('Gov minDeposit in wrong denom:', depositParams.minDeposit);
      this._minDeposit = new CosmosToken(this._Chain.denom, 0);
    }
    console.log(this._minDeposit);

    // query existing proposals
    await this._initProposals();
    this._initialized = true;
  }

  public async getProposal(proposalId: number): Promise<CosmosProposal> {
    const existingProposal = this.store.getByIdentifier(proposalId);
    if (existingProposal) {
      return existingProposal;
    }
    const { proposal } = await this._Chain.api.gov.proposal(proposalId);
    const cosmosProp = new CosmosProposal(
      this._Chain,
      this._Accounts,
      this,
      msgToIProposal(proposal)
    );
    await cosmosProp.init();
    return cosmosProp;
  }

  private async _initProposals(proposalId?: number): Promise<void> {
    let cosmosProposals: CosmosProposal[];
    if (!proposalId) {
      const activeProposals = await getActiveProposalsV1Beta1(this._Chain.api);

      cosmosProposals = activeProposals.map(
        (p) => new CosmosProposal(this._Chain, this._Accounts, this, p)
      );
    } else {
      const { proposal } = await this._Chain.api.gov.proposal(proposalId);
      cosmosProposals = [
        new CosmosProposal(
          this._Chain,
          this._Accounts,
          this,
          msgToIProposal(proposal)
        ),
      ];
    }
    Promise.all(cosmosProposals.map((p) => p.init()));
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

  // TODO: support multiple amount types
  public encodeCommunitySpend(
    title: string,
    description: string,
    recipient: string,
    amount: string
  ): Any {
    const denom = this._minDeposit.denom;
    const coinAmount = [{ amount, denom }];
    const spend = CommunityPoolSpendProposal.fromPartial({
      title,
      description,
      recipient,
      amount: coinAmount,
    });
    const prop = CommunityPoolSpendProposal.encode(spend).finish();
    return Any.fromPartial({
      typeUrl: '/cosmos.distribution.v1beta1.CommunityPoolSpendProposal',
      value: prop,
    });
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
    await this._initProposals(id);
    return id;
  }
}

export default CosmosGovernance;
