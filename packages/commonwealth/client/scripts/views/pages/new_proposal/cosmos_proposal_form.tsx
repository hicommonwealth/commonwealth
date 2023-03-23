import React, { useState } from 'react';
import type { Any as ProtobufAny } from 'cosmjs-types/google/protobuf/any';

import { notifyError } from 'controllers/app/notifications';
import type CosmosAccount from 'controllers/chain/cosmos/account';
import type Cosmos from 'controllers/chain/cosmos/adapter';
import { CosmosToken } from 'controllers/chain/cosmos/types';

import app from 'state';
import { CWButton } from '../../components/component_kit/cw_button';
import { CWLabel } from '../../components/component_kit/cw_label';
import { CWRadioGroup } from '../../components/component_kit/cw_radio_group';
import { CWSpinner } from '../../components/component_kit/cw_spinner';
import { CWTextArea } from '../../components/component_kit/cw_text_area';
import { CWTextInput } from '../../components/component_kit/cw_text_input';
import { useCommonNavigate } from 'navigation/helpers';

export const CosmosProposalForm = () => {
  const [cosmosProposalType, setCosmosProposalType] = useState<
    'textProposal' | 'communitySpend'
  >('textProposal');
  const [description, setDescription] = useState<string>('');
  const [payoutAmount, setPayoutAmount] = useState<number>(0);
  const [recipient, setRecipient] = useState<string>('');
  const [title, setTitle] = useState<string>('');

  const navigate = useCommonNavigate();

  const author = app.user.activeAccount as CosmosAccount;
  const cosmos = app.chain as Cosmos;

  const [deposit, setDeposit] = useState<number>(+cosmos.governance.minDeposit);

  return !cosmos.governance.initialized ? (
    <CWSpinner />
  ) : (
    <>
      <CWLabel label="Proposal Type" />
      <CWRadioGroup
        name="cosmos-proposal-type"
        onChange={(value) => {
          setCosmosProposalType(value);
        }}
        toggledOption="textProposal"
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
      <CWTextInput
        label={`Deposit (${cosmos.governance.minDeposit.denom})`}
        placeholder={`Min: ${+cosmos.governance.minDeposit}`}
        defaultValue={+cosmos.governance.minDeposit}
        onInput={(e) => {
          setDeposit(+e.target.value);
        }}
      />
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
          label={`Amount (${cosmos.governance.minDeposit.denom})`}
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
            ? new CosmosToken(
                cosmos.governance.minDeposit.denom,
                deposit,
                false
              )
            : cosmos.governance.minDeposit;

          if (cosmosProposalType === 'textProposal') {
            prop = cosmos.governance.encodeTextProposal(title, description);
          } else if (cosmosProposalType === 'communitySpend') {
            prop = cosmos.governance.encodeCommunitySpend(
              title,
              description,
              recipient,
              payoutAmount
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
