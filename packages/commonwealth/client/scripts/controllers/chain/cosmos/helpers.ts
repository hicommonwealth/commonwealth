import { CosmosToken } from './types';
import { Any } from 'common-common/src/cosmos-ts/src/codegen/google/protobuf/any';
import {
  MsgSubmitProposalEncodeObject,
  MsgVoteEncodeObject,
  SigningStargateClient,
} from '@cosmjs/stargate';
import { longify } from '@cosmjs/stargate/build/queries/utils';
import { OfflineSigner } from '@cosmjs/proto-signing';

export const encodeMsgSubmitProposal = (
  sender: string,
  initialDeposit: CosmosToken,
  content: Any
): MsgSubmitProposalEncodeObject => {
  return {
    typeUrl: '/cosmos.gov.v1beta1.MsgSubmitProposal',
    value: {
      initialDeposit: [initialDeposit.toCoinObject()],
      proposer: sender,
      content,
    },
  };
};

export const encodeMsgVote = (
  voter: string,
  proposalId: number | Long | string,
  option: number
): MsgVoteEncodeObject => {
  return {
    typeUrl: '/cosmos.gov.v1beta1.MsgVote',
    value: {
      proposalId: longify(proposalId),
      voter,
      option,
    },
  };
};

export const getSigningClient = async (
  url: string,
  signer: OfflineSigner
): Promise<SigningStargateClient> => {
  const client = await SigningStargateClient.connectWithSigner(url, signer);
  return client;
};
