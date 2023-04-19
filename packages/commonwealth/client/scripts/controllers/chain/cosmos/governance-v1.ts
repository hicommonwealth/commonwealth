import BN from 'bn.js';
import type {
  CosmosProposalState,
  ICosmosProposal,
  ICosmosProposalTally,
} from 'controllers/chain/cosmos/types';
import { CosmosToken } from 'controllers/chain/cosmos/types';
import { CommunityPoolSpendProposal } from 'cosmjs-types/cosmos/distribution/v1beta1/distribution';
import {
  ProposalSDKType,
  TallyResultSDKType,
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
import { CosmosProposalV1 } from './proposal-v1';
import { numberToLong } from 'common-common/src/cosmos-ts/src/codegen/helpers';
import { encodeMsgSubmitProposal } from './helpers';

/** This file is a copy of controllers/chain/cosmos/governance.ts, modified for
 * gov module version v1. This is considered a patch to make sure v1-enabled chains
 * load proposals. Eventually we will ideally move back to one governance.ts file.
 * Patch state:
 *
 * - governance.ts uses cosmJS v1beta1 gov
 * - governance-v1.ts uses telescope-generated v1 gov  */

const stateEnumToString = (status: string): CosmosProposalState => {
  switch (status) {
    case 'PROPOSAL_STATUS_UNSPECIFIED':
      return 'Unspecified';
    case 'PROPOSAL_STATUS_DEPOSIT_PERIOD':
      return 'DepositPeriod';
    case 'PROPOSAL_STATUS_VOTING_PERIOD':
      return 'VotingPeriod';
    case 'PROPOSAL_STATUS_PASSED':
      return 'Passed';
    case 'PROPOSAL_STATUS_FAILED':
      return 'Failed';
    case 'PROPOSAL_STATUS_REJECTED':
      return 'Rejected';
    case 'UNRECOGNIZED':
      return 'Unrecognized';
    default:
      throw new Error(`Invalid proposal state: ${status}`);
  }
};

const isCompleted = (status: string): boolean => {
  return status === 'Passed' || status === 'Rejected' || status === 'Failed';
};

export const marshalTallyV1 = (
  tally: TallyResultSDKType
): ICosmosProposalTally => {
  if (!tally) return null;
  return {
    yes: new BN(tally.yes_count),
    abstain: new BN(tally.abstain_count),
    no: new BN(tally.no_count),
    noWithVeto: new BN(tally.no_with_veto_count),
  };
};

class CosmosGovernanceV1 extends ProposalModule<
  CosmosApiType,
  ICosmosProposal,
  CosmosProposalV1
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
      this._votingPeriodS = +voting_params.voting_period.replace('s', '');
      this._yesThreshold = +tally_params?.threshold;
      this._vetoThreshold = +tally_params?.veto_threshold;
      this._maxDepositPeriodS = +deposit_params?.max_deposit_period.replace(
        's',
        ''
      );

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
    const propToIProposal = (p: ProposalSDKType): ICosmosProposal | null => {
      const status = stateEnumToString(p.status.toString());
      const identifier = p.id.toString();
      let title = '';
      let description = '';
      let messages = [];
      if (p.messages?.length > 0) {
        messages = p.messages.map((m) => {
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
        submitTime: moment.unix(new Date(p.submit_time).valueOf() / 1000),
        depositEndTime: moment.unix(
          new Date(p.deposit_end_time).valueOf() / 1000
        ),
        votingEndTime: moment.unix(
          new Date(p.voting_end_time).valueOf() / 1000
        ),
        votingStartTime: moment.unix(
          new Date(p.voting_start_time).valueOf() / 1000
        ),
        proposer: null,
        state: {
          identifier,
          completed: isCompleted(status),
          status,
          // TODO: handle non-default amount
          totalDeposit:
            p.total_deposit && p.total_deposit[0]
              ? new BN(p.total_deposit[0].amount)
              : new BN(0),
          depositors: [],
          voters: [],
          tally: p.final_tally_result && marshalTallyV1(p.final_tally_result),
        },
      };
    };

    let cosmosProposals: CosmosProposalV1[] = [];
    try {
      if (!proposalId) {
        const {
          proposals,
          pagination,
        } = await this._Chain.lcd.cosmos.gov.v1.proposals({
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
          const {
            proposals: addlProposals,
            pagination: nextPage,
          } = await this._Chain.lcd.cosmos.gov.v1.proposals({
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
          .map(
            (p) => new CosmosProposalV1(this._Chain, this._Accounts, this, p)
          );
      } else {
        const { proposal } = await this._Chain.lcd.cosmos.gov.v1.proposal({
          proposalId: numberToLong(proposalId),
        });
        cosmosProposals = [
          new CosmosProposalV1(
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
    const msg = encodeMsgSubmitProposal(
      sender.address,
      initialDeposit,
      content
    );

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
