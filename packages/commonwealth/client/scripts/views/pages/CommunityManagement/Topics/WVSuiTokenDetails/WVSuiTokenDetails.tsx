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
import { ValidationStatus } from 'views/components/component_kit/cw_validation_text';
import { HandleCreateTopicProps } from 'views/pages/CommunityManagement/Topics/Topics';
import './WVSuiTokenDetails.scss';

interface TokenConfig {
  tokenAddress: string;
  tokenDecimals: number;
  voteWeightMultiplier: number;
}

interface WVSuiTokenDetailsProps {
  onStepChange: (step: CreateTopicStep) => void;
  onCreateTopic: (props: HandleCreateTopicProps) => Promise<void>;
}

const WVSuiTokenDetails = ({
  onStepChange,
  onCreateTopic,
}: WVSuiTokenDetailsProps) => {
  const [tokens, setTokens] = useState<TokenConfig[]>([
    {
      tokenAddress: '',
      tokenDecimals: 9,
      voteWeightMultiplier: 1,
    },
  ]);
  const [loading, setLoading] = useState(false);

  const chainNodeId = app?.chain?.meta?.ChainNode?.id;

  // Validation function for Sui contract address format
  const validateSuiAddress = (
    value: string,
  ): [ValidationStatus, string] | [] => {
    if (!value) return [];

    const segments = value.split('::');
    if (segments.length < 3) {
      return [
        'failure',
        'Address must contain at least 3 segments separated by "::"',
      ];
    }

    // Check if each segment is non-empty
    for (const segment of segments) {
      if (!segment.trim()) {
        return ['failure', 'All segments must be non-empty'];
      }
    }

    return ['success', 'Valid Sui address format'];
  };

  const handleAddToken = () => {
    setTokens([
      ...tokens,
      {
        tokenAddress: '',
        tokenDecimals: 9,
        voteWeightMultiplier: 1,
      },
    ]);
  };

  const handleRemoveToken = (index: number) => {
    setTokens(tokens.filter((_, i) => i !== index));
  };

  const handleTokenChange = (
    index: number,
    field: keyof TokenConfig,
    value: string | number,
  ) => {
    const newTokens = [...tokens];
    newTokens[index] = {
      ...newTokens[index],
      [field]: field === 'tokenAddress' ? value : Number(value),
    };
    setTokens(newTokens);
  };

  const handleSubmit = async () => {
    // Validate all tokens have required fields
    const invalidTokens = tokens.filter(
      (t) => !t.tokenAddress || t.voteWeightMultiplier <= 0,
    );
    if (invalidTokens.length > 0 || !chainNodeId) {
      notifyError('Please fill in all required fields for each token');
      return;
    }

    setLoading(true);
    try {
      // Use the first token as the primary token
      const primaryToken = tokens[0];
      const secondaryTokens = tokens.slice(1).map((t) => ({
        token_address: t.tokenAddress,
        token_symbol: '', // This will need to be fetched or provided later
        token_decimals: t.tokenDecimals,
        vote_weight_multiplier: t.voteWeightMultiplier,
      }));

      await onCreateTopic({
        suiToken: {
          tokenAddress: primaryToken.tokenAddress,
          tokenDecimals: primaryToken.tokenDecimals,
          voteWeightMultiplier: primaryToken.voteWeightMultiplier,
          chainNodeId,
          weightedVoting: TopicWeightedVoting.SuiToken,
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
    <div className="WVSuiTokenDetails">
      <CWText type="h2">Weighted voting</CWText>
      <CWText type="b1" className="description">
        Activate weighted voting to allow members to cast votes proportional to
        their stake or contribution, ensuring decisions reflect the
        community&apos;s investment levels.
      </CWText>

      <CWDivider />

      <CWText type="h4">Connect Sui Tokens</CWText>
      <CWText type="b1" className="description">
        You can configure multiple tokens. The vote weights from all tokens will
        be summed together.
      </CWText>

      {tokens.map((token, index) => (
        <div key={index} className="token-config-section">
          <div className="token-header">
            <CWText type="h5">Token {index + 1}</CWText>
            {tokens.length > 1 && (
              <CWIconButton
                iconName="close"
                iconSize="small"
                onClick={() => handleRemoveToken(index)}
              />
            )}
          </div>

          <CWText type="b2" className="field-label">
            Coin Type
          </CWText>
          <CWText type="b1" className="description">
            Enter the Sui Coin Type (e.g.,
            0xe1b45a0e641b9955a20aa0ad1c1f4ad86aad8afb07296d4085e349a50e90bdca::blue::BLUE)
          </CWText>
          <CWTextInput
            value={token.tokenAddress}
            onInput={(e) =>
              handleTokenChange(index, 'tokenAddress', e.target.value)
            }
            placeholder="Enter Sui Coin Type"
            fullWidth
            inputValidationFn={validateSuiAddress}
          />

          <CWText type="b2" className="field-label">
            Token Decimals
          </CWText>
          <CWText type="b1" className="description">
            Enter the number of decimals for the token
          </CWText>
          <CWTextInput
            type="number"
            min={0}
            value={token.tokenDecimals}
            onInput={(e) =>
              handleTokenChange(index, 'tokenDecimals', e.target.value)
            }
            placeholder="Enter token decimals"
          />

          <CWText type="b2" className="field-label">
            Vote weight multiplier
          </CWText>
          <div className="input-row">
            <CWText type="b1" className="description">
              1 token is equal to
            </CWText>
            <CWTextInput
              type="number"
              min={1}
              isCompact
              value={token.voteWeightMultiplier}
              onInput={(e) =>
                handleTokenChange(index, 'voteWeightMultiplier', e.target.value)
              }
            />
            <CWText type="b1" className="description">
              votes.
            </CWText>
          </div>
          <CWText type="b1" className="description">
            Vote weight per token held by the user will be{' '}
            {token.voteWeightMultiplier || 0}.
          </CWText>

          {index < tokens.length - 1 && <CWDivider />}
        </div>
      ))}

      <CWButton
        type="button"
        label="Add another token"
        buttonType="tertiary"
        onClick={handleAddToken}
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
            tokens.some(
              (t) => !t.tokenAddress || t.voteWeightMultiplier <= 0,
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
export default WVSuiTokenDetails;
