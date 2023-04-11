import type { MsgSubmitProposalEncodeObject } from '@cosmjs/stargate';
import BN from 'bn.js';
import type {
  CosmosProposalState,
  ICosmosProposal,
  ICosmosProposalTally,
} from 'controllers/chain/cosmos/types';
import { CosmosToken } from 'controllers/chain/cosmos/types';
import { CommunityPoolSpendProposal } from 'cosmjs-types/cosmos/distribution/v1beta1/distribution';
import {
  DepositParams,
  Proposal,
  ProposalSDKType,
  TallyResult,
  VotingParams,
} from 'common-common/src/cosmos-ts/src/codegen/cosmos/gov/v1/gov';
import { Any } from 'common-common/src/cosmos-ts/src/codegen/google/protobuf/any';
import { ProposalStatus } from 'common-common/src/cosmos-ts/src/codegen/cosmos/gov/v1/gov';
import { TextProposal } from 'cosmjs-types/cosmos/gov/v1beta1/gov';

import type { ITXModalData } from 'models';
import { ProposalModule } from 'models';
import moment from 'moment';
import type CosmosAccount from './account';
import type CosmosAccounts from './accounts';
import type CosmosChain from './chain';
import type { CosmosApiType } from './chain';
import { CosmosProposal } from './proposal';
import { numberToLong } from 'common-common/src/cosmos-ts/src/codegen/helpers';

/** This file is a copy of controllers/chain/cosmos/governance.ts, modified for
 * gov module version v1. This is considered a patch to make sure v1-enabled chains
 * load proposals. Eventually we will ideally move back to one governance.ts file.
 * Patch state:
 *
 * - governance.ts uses cosmJS v1beta1 gov
 * - governance-v1.ts uses telescope-generated v1 gov  */

const stateEnumToString = (status: ProposalStatus): CosmosProposalState => {
  switch (status) {
    case ProposalStatus.PROPOSAL_STATUS_UNSPECIFIED:
      return 'Unspecified';
    case ProposalStatus.PROPOSAL_STATUS_DEPOSIT_PERIOD:
      return 'DepositPeriod';
    case ProposalStatus.PROPOSAL_STATUS_VOTING_PERIOD:
      return 'VotingPeriod';
    case ProposalStatus.PROPOSAL_STATUS_PASSED:
      return 'Passed';
    case ProposalStatus.PROPOSAL_STATUS_FAILED:
      return 'Failed';
    case ProposalStatus.PROPOSAL_STATUS_REJECTED:
      return 'Rejected';
    case ProposalStatus.UNRECOGNIZED:
      return 'Unrecognized';
    default:
      throw new Error(`Invalid proposal state: ${status}`);
  }
};

const isCompleted = (status: string): boolean => {
  return status === 'Passed' || status === 'Rejected' || status === 'Failed';
};

export const marshalTally = (tally: TallyResult): ICosmosProposalTally => {
  if (!tally) return null;
  return {
    yes: new BN(tally.yesCount),
    abstain: new BN(tally.abstainCount),
    no: new BN(tally.noCount),
    noWithVeto: new BN(tally.noWithVetoCount),
  };
};

class CosmosGovernanceV1 extends ProposalModule<
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
    try {
      // query chain-wide params
      const { deposit_params } = await this._Chain.lcd.cosmos.gov.v1.params({
        paramsType: 'deposit',
      });
      const { tally_params } = await this._Chain.lcd.cosmos.gov.v1.params({
        paramsType: 'tallying',
      });
      const { voting_params } = await this._Chain.lcd.cosmos.gov.v1.params({
        paramsType: 'voting',
      });
      this._votingPeriodS =
        +VotingParams.fromSDK(voting_params)?.votingPeriod.seconds;
      this._yesThreshold = +tally_params?.threshold;
      this._vetoThreshold = +tally_params?.veto_threshold;
      this._maxDepositPeriodS =
        +DepositParams.fromSDK(deposit_params)?.maxDepositPeriod.seconds;

      // TODO: support off-denom deposits
      const depositCoins = deposit_params?.min_deposit.find(
        ({ denom }) => denom === this._Chain.denom
      );
      if (depositCoins) {
        this._minDeposit = new CosmosToken(
          depositCoins.denom,
          new BN(depositCoins.amount)
        );
      } else {
        console.error(
          'Gov minDeposit in wrong denom:',
          deposit_params?.min_deposit
        );
        this._minDeposit = new CosmosToken(this._Chain.denom, 0);
      }
      console.log(this._minDeposit);
    } catch (e) {
      console.error(e);
    }

    // query existing proposals
    await this._initProposals();
    this._initialized = true;
  }

  private async _initProposals(proposalId?: number): Promise<void> {
    const propToIProposal = (
      proposal: ProposalSDKType
    ): ICosmosProposal | null => {
      const p = Proposal.fromSDK(proposal);
      const status = stateEnumToString(p.status);
      const identifier = p.id.toString();
      let title = p.title;
      let description = p.summary;
      let messages = [];
      // Proposal.fromSDK(proposal) does not preserve `messages`, so use `proposal`
      if (proposal.messages?.length > 0) {
        messages = proposal.messages.map((m) => {
          const content = m['content'];
          // get title and description from 1st message if no top-level title/desc
          if (!title) title = content?.title;
          if (!description) description = content?.description;
          return {
            typeUrl: m.type_url,
            value: m.value,
          };
        });
      }

      return {
        identifier,
        type: 'text',
        title,
        description,
        messages,
        submitTime: moment.unix(+p.submitTime.seconds / 1000),
        depositEndTime: moment.unix(+p.depositEndTime.seconds / 1000),
        votingEndTime: moment.unix(+p.votingEndTime.seconds / 1000),
        votingStartTime: moment.unix(+p.votingStartTime.seconds / 1000),
        proposer: null,
        state: {
          identifier,
          completed: isCompleted(status),
          status,
          // TODO: handle non-default amount
          totalDeposit:
            p.totalDeposit && p.totalDeposit[0]
              ? new BN(p.totalDeposit[0].amount)
              : new BN(0),
          depositors: [],
          voters: [],
          tally: p.finalTallyResult && marshalTally(p.finalTallyResult),
        },
      };
    };

    let cosmosProposals: CosmosProposal[] = [];
    try {
      if (!proposalId) {
        const { proposals, pagination } =
          await this._Chain.lcd.cosmos.gov.v1.proposals({
            proposalStatus: ProposalStatus.PROPOSAL_STATUS_UNSPECIFIED,
            voter: '',
            depositor: '',
          });

        // fetch all proposals
        // TODO: only fetch next page of proposals on scroll
        let nextKey = pagination.next_key;
        let prevKey = null; // avoid infinite loop
        while (nextKey?.length > 0 && nextKey !== prevKey) {
          console.log('nextKey', nextKey);
          const { proposals: addlProposals, pagination: nextPage } =
            await this._Chain.lcd.cosmos.gov.v1.proposals({
              proposalStatus: ProposalStatus.PROPOSAL_STATUS_UNSPECIFIED,
              voter: '',
              depositor: '',
              pagination: {
                key: nextKey,
                limit: null,
                offset: null,
                countTotal: true,
                reverse: true,
              },
            });

          proposals.push(...addlProposals);
          prevKey = nextKey;
          nextKey = nextPage.next_key;
        }

        cosmosProposals = proposals
          ?.map((p) => propToIProposal(p))
          .filter((p) => !!p)
          .sort((p1, p2) => +p2.identifier - +p1.identifier)
          .map((p) => new CosmosProposal(this._Chain, this._Accounts, this, p));
      } else {
        const { proposal } = await this._Chain.lcd.cosmos.gov.v1.proposal({
          proposalId: numberToLong(proposalId),
        });
        cosmosProposals = [
          new CosmosProposal(
            this._Chain,
            this._Accounts,
            this,
            propToIProposal(proposal)
          ),
        ];
      }
      Promise.all(cosmosProposals?.map((p) => p.init()));
    } catch (error) {
      console.error('Error fetching proposals: ', error);
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

  public encodeTextProposal(title: string, description: string): Any {
    const tProp = TextProposal.fromPartial({ title, description });
    return Any.fromPartial({
      typeUrl: '/cosmos.gov.v1beta1.TextProposal',
      value: Uint8Array.from(TextProposal.encode(tProp).finish()),
    });
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
    const msg: MsgSubmitProposalEncodeObject = {
      typeUrl: '/cosmos.gov.v1beta1.MsgSubmitProposal',
      value: {
        initialDeposit: [initialDeposit.toCoinObject()],
        proposer: sender.address,
        content,
      },
    };

    // fetch completed proposal from returned events
    const events = await this._Chain.sendTx(sender, msg);
    console.log(events);
    const submitEvent = events?.find((e) => e.type === 'submit_proposal');
    const cosm = await import('@cosmjs/encoding');
    const idAttribute = submitEvent?.attributes.find(
      ({ key }) => key && cosm.fromAscii(key) === 'proposal_id'
    );
    const id = +cosm.fromAscii(idAttribute.value);
    await this._initProposals(id);
    return id;
  }
}

export default CosmosGovernanceV1;
