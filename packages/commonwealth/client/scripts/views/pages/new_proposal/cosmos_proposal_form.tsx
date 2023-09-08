import React, { useState } from 'react';
import type { Any as ProtobufAny } from 'cosmjs-types/google/protobuf/any';

import { notifyError } from 'controllers/app/notifications';
import type CosmosAccount from 'controllers/chain/cosmos/account';
import type Cosmos from 'controllers/chain/cosmos/adapter';
import { CosmosToken } from 'controllers/chain/cosmos/types';
import {
  encodeCommunitySpend,
  encodeTextProposal,
} from 'controllers/chain/cosmos/gov/v1beta1/utils-v1beta1';
import {
  useDepositParamsQuery,
  useStakingParamsQuery,
} from 'state/api/chainParams';

import app from 'state';
import { CWButton } from '../../components/component_kit/cw_button';
import { CWLabel } from '../../components/component_kit/cw_label';
import { CWRadioGroup } from '../../components/component_kit/cw_radio_group';
import { CWTextArea } from '../../components/component_kit/cw_text_area';
import { CWTextInput } from '../../components/component_kit/cw_text_input';
import { useCommonNavigate } from 'navigation/helpers';
import { Skeleton } from '../../components/Skeleton';

export const CosmosProposalForm = () => {
  const [cosmosProposalType, setCosmosProposalType] = useState<
    'textProposal' | 'communitySpend'
  >('textProposal');
  const [deposit, setDeposit] = useState<number>(0);
  const [description, setDescription] = useState<string>('');
  const [payoutAmount, setPayoutAmount] = useState<number>(0);
  const [recipient, setRecipient] = useState<string>('');
  const [title, setTitle] = useState<string>('');

  const navigate = useCommonNavigate();

  const author = app.user.activeAccount as CosmosAccount;
  const cosmos = app.chain as Cosmos;

  const { data: stakingDenom } = useStakingParamsQuery();
  const { data, isLoading } = useDepositParamsQuery(stakingDenom);
  const minDeposit = data?.minDeposit;

  return (
    <>
      <CWLabel label="Proposal Type" />
      <CWRadioGroup
        name="cosmos-proposal-type"
        onChange={(e) => {
          const value = e.target.value as 'textProposal' | 'communitySpend';
          setCosmosProposalType(value);
        }}
        toggledOption={cosmosProposalType}
        options={[
          { label: 'Text Proposal', value: 'textProposal' },
          { label: 'Community Spend', value: 'communitySpend' },
        ]}
      />
      <CWTextInput
        placeholder="Enter a title"
        label="Title"
        onInput={(e) => {
          setTitle(e.target.value);
        }}
      />
      <CWTextArea
        label="Description"
        placeholder="Enter a description"
        onInput={(e) => {
          setDescription(e.target.value);
        }}
      />
      {isLoading ? (
        <Skeleton className="TextInput" style={{ height: 62 }} />
      ) : (
        <CWTextInput
          label={`Deposit (${minDeposit?.denom})`}
          placeholder={`Min: ${+minDeposit}`}
          defaultValue={+minDeposit}
          onInput={(e) => {
            setDeposit(+e.target.value);
          }}
        />
      )}
      {cosmosProposalType !== 'textProposal' && (
        <CWTextInput
          label="Recipient"
          placeholder={app.user.activeAccount.address}
          defaultValue=""
          onInput={(e) => {
            setRecipient(e.target.value);
          }}
        />
      )}
      {cosmosProposalType !== 'textProposal' && (
        <CWTextInput
          label={`Amount (${minDeposit?.denom})`}
          placeholder="12345"
          defaultValue=""
          onInput={(e) => {
            setPayoutAmount(e.target.value);
          }}
        />
      )}
      <CWButton
        label="Send transaction"
        onClick={(e) => {
          e.preventDefault();

          let prop: ProtobufAny;

          const _deposit = deposit
            ? new CosmosToken(minDeposit?.denom, deposit, false)
            : minDeposit;

          if (cosmosProposalType === 'textProposal') {
            prop = encodeTextProposal(title, description);
          } else if (cosmosProposalType === 'communitySpend') {
            prop = encodeCommunitySpend(
              title,
              description,
              recipient,
              payoutAmount.toString(),
              minDeposit?.denom
            );
          } else {
            throw new Error('Unknown Cosmos proposal type.');
          }

          // TODO: add disabled / loading
          cosmos.governance
            .submitProposalTx(author, _deposit, prop)
            .then((result) => {
              navigate(`/proposal/${result}`);
            })
            .catch((err) => notifyError(err.message));
        }}
      />
    </>
  );
};
