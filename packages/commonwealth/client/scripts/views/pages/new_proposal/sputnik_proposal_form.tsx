import React, { useState } from 'react';

import { useBrowserAnalyticsTrack } from 'client/scripts/hooks/useBrowserAnalyticsTrack';
import { notifyError } from 'controllers/app/notifications';
import type NearSputnik from 'controllers/chain/near/sputnik/adapter';
import type { NearSputnikProposalKind } from 'controllers/chain/near/sputnik/types';
import app from 'state';
import { MixpanelGovernanceEvents } from '../../../../../shared/analytics/types';
import { CWDropdown } from '../../components/component_kit/cw_dropdown';
import { CWTextInput } from '../../components/component_kit/cw_text_input';
import { CWButton } from '../../components/component_kit/new_designs/cw_button';

const sputnikProposalOptions = [
  {
    label: 'Add Member',
    value: 'addMember',
  },
  {
    label: 'Remove Member',
    value: 'removeMember',
  },
  {
    label: 'Payout',
    value: 'payout',
  },
  {
    label: 'Poll',
    value: 'poll',
  },
];

export const SputnikProposalForm = () => {
  const [description, setDescription] = useState('');
  const [member, setMember] = useState('');
  const [payoutAmount, setPayoutAmount] = useState(0);
  const [sputnikProposalType, setSputnikProposalType] = useState(
    sputnikProposalOptions[0].value,
  );
  const [tokenId, setTokenId] = useState('');
  const { trackAnalytics } = useBrowserAnalyticsTrack({ onAction: true });

  const handleSendTransaction = async (e) => {
    e.preventDefault();

    let propArgs: NearSputnikProposalKind;

    if (sputnikProposalType === 'addMember') {
      propArgs = {
        AddMemberToRole: { role: 'council', member_id: member },
      };
    } else if (sputnikProposalType === 'removeMember') {
      propArgs = {
        RemoveMemberFromRole: { role: 'council', member_id: member },
      };
    } else if (sputnikProposalType === 'payout') {
      let amount: string;
      // treat NEAR as in dollars but tokens as whole #s
      if (!tokenId) {
        amount = app.chain.chain.coins(+payoutAmount, true).asBN.toString();
      } else {
        amount = `${+payoutAmount}`;
      }

      propArgs = {
        Transfer: { receiver_id: member, token_id: tokenId, amount },
      };
    } else if (sputnikProposalType === 'vote') {
      propArgs = 'Vote';
    } else {
      throw new Error('unsupported sputnik proposal type');
    }

    try {
      await (app.chain as NearSputnik).dao.proposeTx(description, propArgs);
      trackAnalytics({
        event: MixpanelGovernanceEvents.SPUTNIK_PROPOSAL_CREATED,
      });
    } catch (err) {
      notifyError(err.message);
    }
  };

  return (
    <>
      <CWDropdown
        label="Proposal Type"
        initialValue={sputnikProposalOptions[0]}
        options={sputnikProposalOptions}
        onSelect={(item) => {
          setSputnikProposalType(item.value);
        }}
      />
      {sputnikProposalType !== 'vote' && (
        <CWTextInput
          label="Member"
          defaultValue="tokenfactory.testnet"
          onInput={(e) => {
            setMember(e.target.value);
          }}
        />
      )}
      <CWTextInput
        label="Description"
        defaultValue=""
        onInput={(e) => {
          setDescription(e.target.value);
        }}
      />
      {sputnikProposalType === 'payout' && (
        <CWTextInput
          label="Token ID (leave blank for Ⓝ)"
          defaultValue=""
          onInput={(e) => {
            setTokenId(e.target.value);
          }}
        />
      )}
      {sputnikProposalType === 'payout' && (
        <CWTextInput
          label="Amount"
          defaultValue=""
          onInput={(e) => {
            setPayoutAmount(e.target.value);
          }}
        />
      )}
      <CWButton label="Send transaction" onClick={handleSendTransaction} />
    </>
  );
};
