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
  hasNamespace: boolean;
}

enum WVMethod {
  ERC20 = 'ERC20',
  SPL = 'SPL',
  SuiNative = 'SuiNative',
  SuiToken = 'SuiToken',
  Stake = 'Stake',
}

const WVMethodSelection = ({
  onStepChange,
  hasNamespace,
}: WVMethodSelectionProps) => {
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

    onStepChange(
      hasNamespace
        ? CreateTopicStep.WVERC20Details
        : CreateTopicStep.WVNamespaceEnablement,
    );
  };

  const canEnableStake = chainIdsWithStakeEnabled.includes(
    // @ts-expect-error StrictNullChecks
    app?.chain?.meta?.ChainNode?.eth_chain_id,
  );

  const chainNodeBalanceType = app?.chain?.meta?.ChainNode?.balance_type;

  // Determine if Solana is supported for this community
  const canEnableSPL = chainNodeBalanceType === 'solana';

  // Determine if Sui is supported for this community
  const canEnableSui = chainNodeBalanceType === 'sui';

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
                  community. ERC20s can be used for weighted voting and running
                  contests
                </CWText>
              ),
            }}
            isSelected={selectedWVMethod === WVMethod.ERC20}
          />

          {canEnableSPL && (
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

          {canEnableSui && (
            <>
              <CWRadioPanel
                value={WVMethod.SuiNative}
                onSelect={setSelectedWVMethod}
                label="Connect Sui Native"
                description="Sui Native Object"
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
                label="Connect Sui Token"
                description="Sui Coin Type"
                popover={{
                  title: 'Sui Token',
                  body: (
                    <CWText type="b2">
                      Use Sui tokens for weighted voting and running contests
                    </CWText>
                  ),
                }}
                isSelected={selectedWVMethod === WVMethod.SuiToken}
              />
            </>
          )}

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
                        using a fungible non transferable token. This token can
                        be used for weighted voting and running contests
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
