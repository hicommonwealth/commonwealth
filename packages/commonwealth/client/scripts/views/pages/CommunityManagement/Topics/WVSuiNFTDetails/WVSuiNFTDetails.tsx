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

interface NFTConfig {
  fullObjectType: string;
  voteWeightMultiplier: number;
}

interface WVSuiNFTDetailsProps {
  onStepChange: (step: CreateTopicStep) => void;
  onCreateTopic: (props: HandleCreateTopicProps) => Promise<void>;
}

const WVSuiNFTDetails = ({
  onStepChange,
  onCreateTopic,
}: WVSuiNFTDetailsProps) => {
  const [nft, setNft] = useState<NFTConfig>({
    fullObjectType: '',
    voteWeightMultiplier: 1,
  });
  const [loading, setLoading] = useState(false);

  const chainNodeId = app?.chain?.meta?.ChainNode?.id;

  const handleNFTChange = (field: keyof NFTConfig, value: string | number) => {
    setNft({
      ...nft,
      [field]: field === 'fullObjectType' ? value : Number(value),
    });
  };

  const handleSubmit = async () => {
    // Validate NFT has required fields
    if (!nft.fullObjectType || nft.voteWeightMultiplier <= 0 || !chainNodeId) {
      notifyError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      await onCreateTopic({
        suiToken: {
          tokenAddress: nft.fullObjectType,
          tokenDecimals: 0, // NFTs typically don't have decimals
          voteWeightMultiplier: nft.voteWeightMultiplier,
          chainNodeId,
          weightedVoting: TopicWeightedVoting.SuiNFT,
          // No secondary tokens for NFTs
          secondaryTokens: undefined,
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
      <CWText type="b1" className="description">
        Configure a single NFT collection for weighted voting.
      </CWText>

      <div className="nft-config-section">
        <CWText type="b2" className="field-label">
          Sui NFT Object Type
        </CWText>
        <CWText type="b1" className="description">
          {
            'Enter full object type (e.g., 0x1234::vault::VoteEscrowedToken<0x7890::my_token::MY_TOKEN>)'
          }
        </CWText>
        <CWTextInput
          value={nft.fullObjectType}
          onInput={(e) => handleNFTChange('fullObjectType', e.target.value)}
          placeholder="0x1234…"
          fullWidth
        />

        <CWText type="b2" className="field-label">
          Vote weight multiplier
        </CWText>
        <div className="input-row">
          <CWText type="b1" className="description">
            1 NFT is equal to
          </CWText>
          <CWTextInput
            type="number"
            min={1}
            isCompact
            value={nft.voteWeightMultiplier}
            onInput={(e) =>
              handleNFTChange('voteWeightMultiplier', e.target.value)
            }
          />
          <CWText type="b1" className="description">
            votes.
          </CWText>
        </div>
        <CWText type="b1" className="description">
          Vote weight per NFT held by the user will be{' '}
          {nft.voteWeightMultiplier || 0}.
        </CWText>
      </div>

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
            !nft.fullObjectType ||
            nft.voteWeightMultiplier <= 0 ||
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
export default WVSuiNFTDetails;
