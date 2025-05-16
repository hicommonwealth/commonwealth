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
import './WVSuiTokenDetails.scss';

interface WVSuiTokenDetailsProps {
  onStepChange: (step: CreateTopicStep) => void;
  onCreateTopic: (props: HandleCreateTopicProps) => Promise<void>;
}

const WVSuiTokenDetails = ({
  onStepChange,
  onCreateTopic,
}: WVSuiTokenDetailsProps) => {
  const [tokenAddress, setTokenAddress] = useState('');
  const [tokenSymbol, setTokenSymbol] = useState('');
  const [tokenDecimals, setTokenDecimals] = useState(9);
  const [multiplier, setMultiplier] = useState(1);
  const [loading, setLoading] = useState(false);

  const chainNodeId = app?.chain?.meta?.ChainNode?.id;

  const handleSubmit = async () => {
    if (!tokenAddress || !tokenSymbol || !chainNodeId) {
      notifyError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      await onCreateTopic({
        suiToken: {
          tokenAddress,
          tokenSymbol,
          tokenDecimals,
          voteWeightMultiplier: multiplier,
          chainNodeId,
          weightedVoting: TopicWeightedVoting.SuiToken,
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
    <div className="WVSuiTokenDetails">
      <CWText type="h2">Weighted voting</CWText>
      <CWText type="b1" className="description">
        Activate weighted voting to allow members to cast votes proportional to
        their stake or contribution, ensuring decisions reflect the
        community&apos;s investment levels.
      </CWText>

      <CWDivider />

      <CWText type="h4">Connect Sui Token</CWText>

      <CWText type="h5">Coin Type</CWText>
      <CWText type="b1" className="description">
        Enter the Sui Coin Type (e.g.,
        0xe1b45a0e641b9955a20aa0ad1c1f4ad86aad8afb07296d4085e349a50e90bdca::blue::BLUE)
      </CWText>
      <CWTextInput
        value={tokenAddress}
        onInput={(e) => setTokenAddress(e.target.value)}
        placeholder="Enter Sui Coin Type"
      />

      <CWText type="h5">Token Symbol</CWText>
      <CWText type="b1" className="description">
        Enter the token symbol (e.g., BLUE)
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
          disabled={loading}
        />
        <CWButton
          disabled={
            !tokenAddress ||
            !tokenSymbol ||
            !multiplier ||
            loading ||
            !chainNodeId
          }
          type="button"
          buttonWidth="wide"
          label="Enable weighted voting for topic"
          onClick={handleSubmit}
        />
      </section>
    </div>
  );
};
export default WVSuiTokenDetails;
