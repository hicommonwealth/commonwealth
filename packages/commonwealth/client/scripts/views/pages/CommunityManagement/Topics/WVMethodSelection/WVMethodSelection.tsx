import React, { useState } from 'react';

import app from 'state';
import { chainIdsWithStakeEnabled } from 'views/components/CommunityInformationForm/constants';
import { CWDivider } from 'views/components/component_kit/cw_divider';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import CWRadioPanel, {
  CWRadioPanelGroup,
} from 'views/components/component_kit/new_designs/CWRadioPanel';

import { CreateTopicStep } from '../utils';

import './WVMethodSelection.scss';

interface WVMethodSelectionProps {
  onStepChange: (step: CreateTopicStep) => void;
}

enum WVMethod {
  ERC20 = 'ERC20',
  SPL = 'SPL',
  SuiNative = 'SuiNative',
  SuiToken = 'SuiToken',
  SuiNFT = 'SuiNFT',
  Stake = 'Stake',
}

const WVMethodSelection = ({ onStepChange }: WVMethodSelectionProps) => {
  const [selectedWVMethod, setSelectedWVMethod] = useState<WVMethod | null>(
    null,
  );

  const handleContinue = () => {
    if (selectedWVMethod === WVMethod.Stake) {
      return onStepChange(CreateTopicStep.WVStake);
    }

    // Handle non-EVM token methods
    if (selectedWVMethod === WVMethod.SPL) {
      return onStepChange(CreateTopicStep.WVSPLDetails);
    }

    if (selectedWVMethod === WVMethod.SuiNative) {
      return onStepChange(CreateTopicStep.WVSuiNativeDetails);
    }

    if (selectedWVMethod === WVMethod.SuiToken) {
      return onStepChange(CreateTopicStep.WVSuiTokenDetails);
    }

    if (selectedWVMethod === WVMethod.SuiNFT) {
      return onStepChange(CreateTopicStep.WVSuiNFTDetails);
    }

    onStepChange(CreateTopicStep.WVERC20Details);
  };

  const canEnableStake = chainIdsWithStakeEnabled.includes(
    // @ts-expect-error StrictNullChecks
    app?.chain?.meta?.ChainNode?.eth_chain_id,
  );

  const chainNodeBalanceType = app?.chain?.meta?.ChainNode?.balance_type;

  // Determine chain types
  const isEVMChain = chainNodeBalanceType === 'ethereum';
  const isSolanaChain = chainNodeBalanceType === 'solana';
  const isSuiChain = chainNodeBalanceType === 'sui';

  return (
    <div className="WVMethodSelection">
      <section className="header">
        <CWText type="h2">Weighted voting</CWText>
        <CWText type="b1" className="description">
          Activate weighted voting to allow members to cast votes proportional
          to their stake or contribution, ensuring decisions reflect the
          community&apos;s investment levels.
        </CWText>

        <CWText type="h4">Choose weight voting method</CWText>

        <CWRadioPanelGroup>
          {(isEVMChain || !chainNodeBalanceType) && (
            <CWRadioPanel
              value={WVMethod.ERC20}
              onSelect={setSelectedWVMethod}
              label="Connect ERC20/ETH"
              description="ERC20 Token or Native ETH"
              popover={{
                title: 'ERC20',
                body: (
                  <CWText type="b2">
                    Use any ERC 20 token that is on the same chain as your
                    community. ERC20s can be used for weighted voting and
                    running contests
                  </CWText>
                ),
              }}
              isSelected={selectedWVMethod === WVMethod.ERC20}
            />
          )}

          {isSolanaChain && (
            <CWRadioPanel
              value={WVMethod.SPL}
              onSelect={setSelectedWVMethod}
              label="Connect SPL Token"
              description="Solana Program Library Token"
              popover={{
                title: 'SPL',
                body: (
                  <CWText type="b2">
                    Use any SPL token from the Solana blockchain. SPL tokens can
                    be used for weighted voting and running contests
                  </CWText>
                ),
              }}
              isSelected={selectedWVMethod === WVMethod.SPL}
            />
          )}

          {isSuiChain && (
            <>
              <CWRadioPanel
                value={WVMethod.SuiNative}
                onSelect={setSelectedWVMethod}
                label="Sui Native"
                description="Use native Sui tokens for weighted voting"
                popover={{
                  title: 'Sui Native',
                  body: (
                    <CWText type="b2">
                      Use Sui Native objects for weighted voting and running
                      contests
                    </CWText>
                  ),
                }}
                isSelected={selectedWVMethod === WVMethod.SuiNative}
              />

              <CWRadioPanel
                value={WVMethod.SuiToken}
                onSelect={setSelectedWVMethod}
                label="Sui Coin Type"
                description="Use custom Sui coin types for weighted voting"
                popover={{
                  title: 'Sui Coin Type',
                  body: (
                    <CWText type="b2">
                      Use Sui tokens for weighted voting and running contests
                    </CWText>
                  ),
                }}
                isSelected={selectedWVMethod === WVMethod.SuiToken}
              />

              <CWRadioPanel
                value={WVMethod.SuiNFT}
                onSelect={setSelectedWVMethod}
                label="Sui NFT Type"
                description="Use Sui NFTs for weighted voting"
                popover={{
                  title: 'Sui NFT Type',
                  body: (
                    <CWText type="b2">
                      Use Sui NFTs for weighted voting and running contests
                    </CWText>
                  ),
                }}
                isSelected={selectedWVMethod === WVMethod.SuiNFT}
              />
            </>
          )}

          {(isEVMChain || !chainNodeBalanceType) && (
            <CWRadioPanel
              value={WVMethod.Stake}
              onSelect={setSelectedWVMethod}
              label="Use Community stake"
              description="Use non-transferable tokens"
              popover={
                canEnableStake
                  ? {
                      title: 'Stake',
                      body: (
                        <CWText type="b2">
                          Community Stake lets you buy a stake in your community
                          using a fungible non transferable token. This token
                          can be used for weighted voting and running contests
                        </CWText>
                      ),
                    }
                  : {
                      title: 'Disabled',
                      body: 'Stake is not supported on your network',
                    }
              }
              isSelected={selectedWVMethod === WVMethod.Stake}
              disabled={!canEnableStake}
            />
          )}
        </CWRadioPanelGroup>

        <CWDivider />

        <section className="action-buttons">
          <CWButton
            type="button"
            label="Back"
            buttonWidth="wide"
            buttonType="secondary"
            onClick={() => onStepChange(CreateTopicStep.WVConsent)}
          />
          <CWButton
            disabled={!selectedWVMethod}
            type="button"
            buttonWidth="wide"
            label="Continue"
            onClick={handleContinue}
          />
        </section>
      </section>
    </div>
  );
};
export default WVMethodSelection;
