import {
  MsgSubmitProposal,
  MsgDeposit,
  MsgVote,
} from 'cosmjs-types/cosmos/gov/v1beta1/tx';

import type { CWEvent } from '../../../interfaces';
import { SupportedNetwork } from '../../../interfaces';
import type { Api, IEventData, RawEvent } from '../types';
import { coinToCoins, EventKind } from '../types';

export async function Enrich(
  api: Api,
  blockNumber: number,
  kind: EventKind,
  rawData: RawEvent
): Promise<CWEvent<IEventData>> {
  switch (kind) {
    case EventKind.SubmitProposal: {
      const submitProposal = MsgSubmitProposal.decode(rawData.message.value);

      // query all proposals and locate the most recent one matching the tx
      // TODO: is there an easier way to do this involving MsgSubmitProposalResponse?
      //   basically, the data we need is the proposal id.
      const { proposals } = await api.rpc.gov.proposals(0, '', '');
      const proposal = proposals.find((p) => {
        if (p.content.typeUrl !== submitProposal.content.typeUrl) return false;
        return Buffer.from(p.content.value).equals(
          Buffer.from(submitProposal.content.value)
        );
      });

      if (!proposal) throw new Error('Proposal not found!');
      return {
        blockNumber,
        network: SupportedNetwork.Cosmos,
        data: {
          kind,
          id: proposal.proposalId.toString(10),
          proposer: submitProposal.proposer,
          content: {
            typeUrl: proposal.content.typeUrl,
            value: Buffer.from(proposal.content.value).toString('hex'),
          },
          submitTime: proposal.submitTime.seconds.toNumber(),
          depositEndTime: proposal.depositEndTime.seconds.toNumber(),
          votingStartTime: proposal.votingStartTime.seconds.toNumber(),
          votingEndTime: proposal.votingEndTime.seconds.toNumber(),
        },
      };
    }
    case EventKind.Deposit: {
      const deposit = MsgDeposit.decode(rawData.message.value);
      return {
        blockNumber,
        network: SupportedNetwork.Cosmos,
        data: {
          kind,
          id: deposit.proposalId.toString(10),
          depositor: deposit.depositor,
          amount: coinToCoins(deposit.amount),
        },
      };
    }
    case EventKind.Vote: {
      const vote = MsgVote.decode(rawData.message.value);
      return {
        blockNumber,
        network: SupportedNetwork.Cosmos,
        data: {
          kind,
          id: vote.proposalId.toString(10),
          voter: vote.voter,
          option: vote.option,
        },
      };
    }
    default: {
      throw new Error(`Unknown event kind: ${kind}`);
    }
  }
}
