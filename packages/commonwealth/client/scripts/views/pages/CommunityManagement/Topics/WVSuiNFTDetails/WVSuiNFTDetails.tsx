import React, { useState } from 'react';

import app from 'state';
import { CWDivider } from 'views/components/component_kit/cw_divider';
import { CWIconButton } from 'views/components/component_kit/cw_icon_button';
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
  const [nfts, setNfts] = useState<NFTConfig[]>([
    {
      fullObjectType: '',
      voteWeightMultiplier: 1,
    },
  ]);
  const [loading, setLoading] = useState(false);

  const chainNodeId = app?.chain?.meta?.ChainNode?.id;

  const handleAddNFT = () => {
    setNfts([
      ...nfts,
      {
        fullObjectType: '',
        voteWeightMultiplier: 1,
      },
    ]);
  };

  const handleRemoveNFT = (index: number) => {
    setNfts(nfts.filter((_, i) => i !== index));
  };

  const handleNFTChange = (
    index: number,
    field: keyof NFTConfig,
    value: string | number,
  ) => {
    const newNFTs = [...nfts];
    newNFTs[index] = {
      ...newNFTs[index],
      [field]: field === 'fullObjectType' ? value : Number(value),
    };
    setNfts(newNFTs);
  };

  const handleSubmit = async () => {
    // Validate all NFTs have required fields
    const invalidNFTs = nfts.filter(
      (n) => !n.fullObjectType || n.voteWeightMultiplier <= 0,
    );
    if (invalidNFTs.length > 0 || !chainNodeId) {
      notifyError('Please fill in all required fields for each NFT');
      return;
    }

    setLoading(true);
    try {
      // Use the first NFT as the primary token
      const primaryNFT = nfts[0];
      const secondaryTokens = nfts.slice(1).map((n) => ({
        token_address: n.fullObjectType,
        token_symbol: '', // NFTs typically don't have symbols
        token_decimals: 0, // NFTs don't have decimals
        vote_weight_multiplier: n.voteWeightMultiplier,
      }));

      await onCreateTopic({
        suiToken: {
          tokenAddress: primaryNFT.fullObjectType,
          tokenDecimals: 0, // NFTs typically don't have decimals
          voteWeightMultiplier: primaryNFT.voteWeightMultiplier,
          chainNodeId,
          weightedVoting: TopicWeightedVoting.SuiNFT,
          secondaryTokens:
            secondaryTokens.length > 0 ? secondaryTokens : undefined,
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

      <CWText type="h4">Connect Sui NFTs</CWText>
      <CWText type="b1" className="description">
        You can configure multiple NFT collections. The vote weights from all
        NFTs will be summed together.
      </CWText>

      {nfts.map((nft, index) => (
        <div key={index} className="nft-config-section">
          <div className="nft-header">
            <CWText type="h5">NFT Collection {index + 1}</CWText>
            {nfts.length > 1 && (
              <CWIconButton
                iconName="close"
                iconSize="small"
                onClick={() => handleRemoveNFT(index)}
              />
            )}
          </div>

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
            onInput={(e) =>
              handleNFTChange(index, 'fullObjectType', e.target.value)
            }
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
                handleNFTChange(index, 'voteWeightMultiplier', e.target.value)
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

          {index < nfts.length - 1 && <CWDivider />}
        </div>
      ))}

      <CWButton
        type="button"
        label="Add another NFT collection"
        buttonType="tertiary"
        onClick={handleAddNFT}
        iconLeft="plus"
        disabled={loading}
      />

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
            nfts.some(
              (n) => !n.fullObjectType || n.voteWeightMultiplier <= 0,
            ) ||
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
