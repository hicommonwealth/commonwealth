import React from 'react';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import { withTooltip } from 'views/components/component_kit/new_designs/CWTooltip';

import '../UniswapTradeModal/UniswapTradeModal.scss';

export const NetworkIndicator = ({
  currentChain,
  isWrongNetwork,
  onSwitchNetwork,
}: {
  currentChain: string | null;
  isWrongNetwork: boolean;
  onSwitchNetwork: () => void;
}) => {
  if (!currentChain) return null;

  return (
    <div className="network-indicator swap-network-indicator">
      <CWText type="caption" className="current-network">
        Current network:
        <span className={isWrongNetwork ? 'wrong-network' : 'correct-network'}>
          {' '}
          {currentChain}
        </span>
        {isWrongNetwork && (
          <>
            {withTooltip(
              <CWIcon
                iconName="warning"
                iconSize="small"
                className="warning-icon"
              />,
              'Swaps only work on the Base network. Click to switch networks.',
              true,
            )}
            <CWButton
              label="Switch to Base"
              buttonHeight="sm"
              buttonType="secondary"
              onClick={onSwitchNetwork}
            />
          </>
        )}
      </CWText>
    </div>
  );
};
