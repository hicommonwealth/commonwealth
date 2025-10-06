import React, { useState } from 'react';

import app from 'state';
import { CWDivider } from 'views/components/component_kit/cw_divider';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import { CWTextInput } from 'views/components/component_kit/new_designs/CWTextInput';

import { CreateTopicStep } from '../utils';

import { TopicWeightedVoting } from '@hicommonwealth/schemas';
import { notifyError } from 'controllers/app/notifications';
import { HandleCreateTopicProps } from 'views/pages/CommunityManagement/Topics/Topics';
import './WVSuiNFTDetails.scss';

interface WVSuiNFTDetailsProps {
  onStepChange: (step: CreateTopicStep) => void;
  onCreateTopic: (props: HandleCreateTopicProps) => Promise<void>;
}

const WVSuiNFTDetails = ({
  onStepChange,
  onCreateTopic,
}: WVSuiNFTDetailsProps) => {
  const [fullObjectType, setFullObjectType] = useState('');
  const [multiplier, setMultiplier] = useState(1);
  const [loading, setLoading] = useState(false);

  const chainNodeId = app?.chain?.meta?.ChainNode?.id;

  const handleSubmit = async () => {
    if (!fullObjectType || !chainNodeId) {
      notifyError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      await onCreateTopic({
        suiToken: {
          tokenAddress: fullObjectType,
          tokenDecimals: 0, // NFTs typically don't have decimals
          voteWeightMultiplier: multiplier,
          chainNodeId,
          weightedVoting: TopicWeightedVoting.SuiNFT,
        },
      });
    } catch (err) {
      notifyError('Failed to create topic');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="WVSuiNFTDetails">
      <CWText type="h2">Weighted voting</CWText>
      <CWText type="b1" className="description">
        Activate weighted voting to allow members to cast votes proportional to
        their stake or contribution, ensuring decisions reflect the
        community&apos;s investment levels.
      </CWText>

      <CWDivider />

      <CWText type="h4">Connect Sui NFT</CWText>

      <CWText type="h5">Sui NFT Object Type</CWText>
      <CWText type="b1" className="description">
        {
          'Enter full object type (e.g., 0x1234::vault::VoteEscrowedToken<0x7890::my_token::MY_TOKEN>)'
        }
      </CWText>
      <CWTextInput
        value={fullObjectType}
        onInput={(e) => setFullObjectType(e.target.value)}
        placeholder="0x1234…"
        fullWidth
      />

      <CWText type="h5">Vote weight multiplier</CWText>

      <div className="input-row">
        <CWText type="b1" className="description">
          1 NFT is equal to
        </CWText>
        <CWTextInput
          type="number"
          min={1}
          isCompact
          value={multiplier}
          onInput={(e) => setMultiplier(Number(e.target.value))}
        />
        <CWText type="b1" className="description">
          votes.
        </CWText>
      </div>
      <CWText type="b1" className="description">
        Vote weight per NFT held by the user will be {multiplier || 0}.
      </CWText>

      <CWText className="info" fontWeight="medium">
        Not sure?
        <a
          target="_blank"
          rel="noopener noreferrer"
          href="https://docs.common.xyz/commonwealth"
        >
          Learn more about weighted voting
        </a>
      </CWText>

      <CWDivider />

      <section className="action-buttons">
        <CWButton
          type="button"
          label="Back"
          buttonWidth="wide"
          buttonType="secondary"
          onClick={() => onStepChange(CreateTopicStep.WVMethodSelection)}
          disabled={loading}
        />
        <CWButton
          disabled={!fullObjectType || !multiplier || loading || !chainNodeId}
          type="button"
          buttonWidth="wide"
          label="Enable weighted voting for topic"
          onClick={handleSubmit}
        />
      </section>
    </div>
  );
};
export default WVSuiNFTDetails;
