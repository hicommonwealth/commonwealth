import React, { useState } from 'react';

import app from 'state';
import { alphabeticallySortedChains } from 'views/components/CommunityInformationForm/constants';
import { CWDivider } from 'views/components/component_kit/cw_divider';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import { CWSelectList } from 'views/components/component_kit/new_designs/CWSelectList';
import { CWTextInput } from 'views/components/component_kit/new_designs/CWTextInput';

import { CreateTopicStep } from '../utils';

import { TopicWeightedVoting } from '@hicommonwealth/schemas';
import { notifyError } from 'controllers/app/notifications';
import TokenFinder, { useTokenFinder } from 'views/components/TokenFinder';
import { HandleCreateTopicProps } from 'views/pages/CommunityManagement/Topics/Topics';
import './WVERC20Details.scss';

interface WVConsentProps {
  onStepChange: (step: CreateTopicStep) => void;
  onCreateTopic: (props: HandleCreateTopicProps) => Promise<void>;
}

const WVERC20Details = ({ onStepChange, onCreateTopic }: WVConsentProps) => {
  const options = alphabeticallySortedChains.filter((c) => c.hasStakeEnabled);

  const defaultChain = options.find(
    (o) => o.value === app.chain.meta.ChainNode?.eth_chain_id,
  );

  const [selectedChain, setSelectedChain] = useState(defaultChain);
  const [multiplier, setMultiplier] = useState(1);
  const {
    debouncedTokenValue,
    getTokenError,
    setTokenValue,
    tokenMetadata,
    tokenMetadataLoading,
    tokenValue,
  } = useTokenFinder({
    nodeEthChainId: app.chain.meta.ChainNode?.eth_chain_id || 0,
  });

  const editMode = false;

  const handleSubmit = () => {
    onCreateTopic({
      erc20: {
        tokenAddress: debouncedTokenValue,
        tokenSymbol: tokenMetadata?.symbol,
        voteWeightMultiplier: multiplier,
        chainNodeId: Number(selectedChain?.chainNodeId),
        weightedVoting: TopicWeightedVoting.ERC20,
      },
    }).catch((err) => {
      notifyError('Failed to create topic');
      console.log(err);
    });
  };

  return (
    <div className="WVERC20Details">
      <CWText type="h2">Weighted voting</CWText>
      <CWText type="b1" className="description">
        Activate weighted voting to allow members to cast votes proportional to
        their stake or contribution, ensuring decisions reflect the
        community&apos;s investment levels.
      </CWText>

      <CWDivider />

      <CWText type="h4">Connect ERC20 token</CWText>

      <CWText type="h5">Your community chain</CWText>
      <CWText type="b1" className="description">
        All token features will be interacting with following chain.
      </CWText>
      <CWSelectList
        isDisabled
        options={options}
        value={selectedChain}
        onChange={setSelectedChain}
        isSearchable={false}
      />

      <CWText type="h5">Primary token</CWText>
      <CWText type="b1" className="description">
        Any token features such as voting or tipping require your community to
        connect a primary token.
      </CWText>
      <TokenFinder
        debouncedTokenValue={debouncedTokenValue}
        tokenMetadataLoading={tokenMetadataLoading}
        tokenMetadata={tokenMetadata}
        setTokenValue={setTokenValue}
        tokenValue={tokenValue}
        containerClassName="token-input"
        disabled={editMode}
        fullWidth
        tokenError={getTokenError()}
      />

      <CWText type="h5">Vote weight multiplier</CWText>

      <div className="input-row">
        <CWText type="b1" className="description">
          1 token is equal to
        </CWText>
        <CWTextInput
          type="number"
          min={1}
          defaultValue={1}
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
          disabled={editMode}
          type="button"
          label="Back"
          buttonWidth="wide"
          buttonType="secondary"
          onClick={() => onStepChange(CreateTopicStep.WVMethodSelection)}
        />
        <CWButton
          disabled={
            !multiplier ||
            !!getTokenError() ||
            tokenMetadataLoading ||
            !debouncedTokenValue
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
export default WVERC20Details;
