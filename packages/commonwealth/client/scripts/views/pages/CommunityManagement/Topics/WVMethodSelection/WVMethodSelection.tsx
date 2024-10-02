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
  Stake = 'Stake',
}

const WVMethodSelection = ({ onStepChange }: WVMethodSelectionProps) => {
  const [selectedWVMethod, setSelectedWVMethod] = useState<WVMethod | null>(
    null,
  );

  const handleContinue = () => {
    if (selectedWVMethod === WVMethod.ERC20) {
      onStepChange(CreateTopicStep.WVERC20Details);
      return;
    }

    onStepChange(CreateTopicStep.WVStake);
  };

  const canEnableStake = chainIdsWithStakeEnabled.includes(
    // @ts-expect-error StrictNullChecks
    app?.chain?.meta?.ChainNode?.eth_chain_id,
  );

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
            label="Connect ERC20 token"
            description="Only ERC20s"
            popover={{ title: 'Example', body: <>lorem ipsum</> }}
            isSelected={selectedWVMethod === WVMethod.ERC20}
          />

          <CWRadioPanel
            value={WVMethod.Stake}
            onSelect={setSelectedWVMethod}
            label="Use Community stake"
            description="Use non-transferable tokens"
            popover={
              canEnableStake
                ? { title: 'Example', body: <>lorem ipsum</> }
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
