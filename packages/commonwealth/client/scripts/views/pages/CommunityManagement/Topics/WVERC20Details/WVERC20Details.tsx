import React, { useState } from 'react';

import { commonProtocol } from '@hicommonwealth/shared';
import { useCommonNavigate } from 'navigation/helpers';
import { alphabeticallySortedChains } from 'views/components/CommunityInformationForm/constants';
import TokenFinder, { useTokenFinder } from 'views/components/TokenFinder';
import { CWDivider } from 'views/components/component_kit/cw_divider';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import { CWSelectList } from 'views/components/component_kit/new_designs/CWSelectList';
import { CWTextInput } from 'views/components/component_kit/new_designs/CWTextInput';
import { CreateTopicStep } from '../utils';
import './WVERC20Details.scss';

const ETH_CHAIN_NODE_ID = 37;

interface WVConsentProps {
  onStepChange: (step: CreateTopicStep) => void;
}

const WVERC20Details = ({ onStepChange }: WVConsentProps) => {
  const navigate = useCommonNavigate();
  const [multiplier, setMultiplier] = useState(1);

  const options = alphabeticallySortedChains.filter((c) => c.hasStakeEnabled);

  const {
    debouncedTokenValue,
    getTokenError,
    setTokenValue,
    tokenMetadata,
    tokenMetadataLoading,
    tokenValue,
  } = useTokenFinder({
    chainId: ETH_CHAIN_NODE_ID,
  });

  const editMode = false;

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

      <CWText type="h5">Supported chains</CWText>
      <CWText type="b1" className="description">
        The following are the pre-selected chain(s) all token features will be
        interacting with.
      </CWText>
      <CWSelectList
        isDisabled={editMode}
        options={options}
        defaultValue={options.find(
          (o) => o.value === commonProtocol.ValidChains.Base,
        )}
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
          onInput={(e) => setMultiplier(e.target.value)}
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
          onClick={() => navigate('/discussions')}
        />
      </section>
    </div>
  );
};
export default WVERC20Details;
