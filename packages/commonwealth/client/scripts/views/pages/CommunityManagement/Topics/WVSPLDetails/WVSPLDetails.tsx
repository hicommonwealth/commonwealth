import React, { useState } from 'react';

import { CWDivider } from 'views/components/component_kit/cw_divider';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import { CWTextInput } from 'views/components/component_kit/new_designs/CWTextInput';

import { CreateTopicStep } from '../utils';

import { TopicWeightedVoting } from '@hicommonwealth/schemas';
import { notifyError } from 'controllers/app/notifications';
import { HandleCreateTopicProps } from 'views/pages/CommunityManagement/Topics/Topics';
import './WVSPLDetails.scss';

interface WVSPLDetailsProps {
  onStepChange: (step: CreateTopicStep) => void;
  onCreateTopic: (props: HandleCreateTopicProps) => Promise<void>;
}

const WVSPLDetails = ({ onStepChange, onCreateTopic }: WVSPLDetailsProps) => {
  const [tokenAddress, setTokenAddress] = useState('');
  const [tokenSymbol, setTokenSymbol] = useState('');
  const [tokenDecimals, setTokenDecimals] = useState(9); // Default for SPL is usually 9
  const [multiplier, setMultiplier] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!tokenAddress || !tokenSymbol) {
      notifyError('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    try {
      await onCreateTopic({
        spl: {
          tokenAddress,
          tokenSymbol,
          tokenDecimals,
          voteWeightMultiplier: multiplier,
          weightedVoting: TopicWeightedVoting.SPL,
        },
      });
    } catch (err) {
      notifyError('Failed to create topic');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="WVSPLDetails">
      <CWText type="h2">Weighted voting</CWText>
      <CWText type="b1" className="description">
        Activate weighted voting to allow members to cast votes proportional to
        their stake or contribution, ensuring decisions reflect the
        community&apos;s investment levels.
      </CWText>

      <CWDivider />

      <CWText type="h4">Connect SPL Token</CWText>

      <CWText type="h5">Token Address</CWText>
      <CWText type="b1" className="description">
        Enter the SPL token mint address
      </CWText>
      <CWTextInput
        value={tokenAddress}
        onInput={(e) => setTokenAddress(e.target.value)}
        placeholder="Enter SPL token mint address"
      />

      <CWText type="h5">Token Symbol</CWText>
      <CWText type="b1" className="description">
        Enter the token symbol (e.g., SOL)
      </CWText>
      <CWTextInput
        value={tokenSymbol}
        onInput={(e) => setTokenSymbol(e.target.value)}
        placeholder="Enter token symbol"
      />

      <CWText type="h5">Token Decimals</CWText>
      <CWText type="b1" className="description">
        Enter the number of decimals for the token
      </CWText>
      <CWTextInput
        type="number"
        min={0}
        value={tokenDecimals}
        onInput={(e) => setTokenDecimals(Number(e.target.value))}
        placeholder="Enter token decimals"
      />

      <CWText type="h5">Vote weight multiplier</CWText>

      <div className="input-row">
        <CWText type="b1" className="description">
          1 token is equal to
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
        Vote weight per token held by the user will be {multiplier || 0}.
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
          disabled={isLoading}
        />
        <CWButton
          disabled={!tokenAddress || !tokenSymbol || !multiplier || isLoading}
          type="button"
          buttonWidth="wide"
          label="Enable weighted voting for topic"
          onClick={handleSubmit}
        />
      </section>
    </div>
  );
};
export default WVSPLDetails;
