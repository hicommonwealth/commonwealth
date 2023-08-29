import { AminoMsg } from '@cosmjs/amino';
import { AminoConverters } from '@cosmjs/stargate/build/aminotypes';
import { AminoMsgSubmitProposal } from '@cosmjs/stargate';
import {
  assert,
  assertDefinedAndNotNull,
  isNonNullObject,
} from '@cosmjs/utils';
import { CommunityPoolSpendProposal } from 'cosmjs-types/cosmos/distribution/v1beta1/distribution';
import { TextProposal } from 'cosmjs-types/cosmos/gov/v1beta1/gov';
import { MsgSubmitProposal } from 'cosmjs-types/cosmos/gov/v1beta1/tx';
import { Any } from 'cosmjs-types/google/protobuf/any';

export function isAminoMsgSubmitProposal(
  msg: AminoMsg
): msg is AminoMsgSubmitProposal {
  return msg.type === 'cosmos-sdk/MsgSubmitProposal';
}

export function createAltGovAminoConverters(): AminoConverters {
  return {
    /** Modified AminoConverter to add support for CommunityPoolSpendProposal */
    '/cosmos.gov.v1beta1.MsgSubmitProposal': {
      aminoType: 'cosmos-sdk/MsgSubmitProposal',
      toAmino: ({
        initialDeposit,
        proposer,
        content,
      }: MsgSubmitProposal): AminoMsgSubmitProposal['value'] => {
        assertDefinedAndNotNull(content);
        let proposal: any;
        switch (content.typeUrl) {
          case '/cosmos.gov.v1beta1.TextProposal': {
            const textProposal = TextProposal.decode(content.value);
            proposal = {
              type: 'cosmos-sdk/TextProposal',
              value: {
                description: textProposal.description,
                title: textProposal.title,
              },
            };
            break;
          }
          case '/cosmos.distribution.v1beta1.CommunityPoolSpendProposal': {
            const spendProposal = CommunityPoolSpendProposal.decode(
              content.value
            );
            proposal = {
              type: 'cosmos-sdk/CommunityPoolSpendProposal',
              value: {
                description: spendProposal.description,
                title: spendProposal.title,
                recipient: spendProposal.recipient,
                amount: spendProposal.amount,
              },
            };
            break;
          }
          default:
            throw new Error(`Unsupported proposal type: '${content.typeUrl}'`);
        }
        return {
          initial_deposit: initialDeposit,
          proposer: proposer,
          content: proposal,
        };
      },
      fromAmino: ({
        initial_deposit,
        proposer,
        content,
      }: AminoMsgSubmitProposal['value']): MsgSubmitProposal => {
        let any_content: Any;
        switch (content.type) {
          case 'cosmos-sdk/TextProposal': {
            const { value } = content;
            assert(isNonNullObject(value));
            const { title, description } = value as any;
            assert(typeof title === 'string');
            assert(typeof description === 'string');
            any_content = Any.fromPartial({
              typeUrl: '/cosmos.gov.v1beta1.TextProposal',
              value: TextProposal.encode(
                TextProposal.fromPartial({
                  title: title,
                  description: description,
                })
              ).finish(),
            });
            break;
          }
          case 'cosmos-sdk/CommunityPoolSpendProposal': {
            const { value } = content;
            assert(isNonNullObject(value));
            const { title, description, recipient, amount } = value as any;
            assert(typeof title === 'string');
            assert(typeof description === 'string');
            assert(typeof recipient === 'string');
            any_content = Any.fromPartial({
              typeUrl:
                '/cosmos.distribution.v1beta1.CommunityPoolSpendProposal',
              value: CommunityPoolSpendProposal.encode(
                CommunityPoolSpendProposal.fromPartial({
                  title: title,
                  description: description,
                  recipient: recipient,
                  amount: Array.from(amount),
                })
              ).finish(),
            });
            break;
          }
          default:
            throw new Error(`Unsupported proposal type: '${content.type}'`);
        }
        return {
          initialDeposit: Array.from(initial_deposit),
          proposer: proposer,
          content: any_content,
        };
      },
    },
  };
}
