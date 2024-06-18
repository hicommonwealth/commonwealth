import clsx from 'clsx';
import React from 'react';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWIdentificationTag } from 'views/components/component_kit/new_designs/CWIdentificationTag';

import useJoinCommunity from 'views/components/SublayoutHeader/useJoinCommunity';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import './AccountConnectionIndicator.scss';

interface AccountConnectionIndicatorProps {
  connected: boolean;
  address: string;
  commonWalletAddress?: string;
}

const AccountConnectionIndicator = ({
  connected,
  address,
  commonWalletAddress,
}: AccountConnectionIndicatorProps) => {
  const { handleJoinCommunity, JoinCommunityModals } = useJoinCommunity();
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };
  return (
    <>
      <div
        className="AccountConnectionIndicator"
        onClick={() =>
          copyToClipboard(commonWalletAddress ? commonWalletAddress : address)
        }
      >
        {connected && (
          <div className="status-address">
            <CWText fontWeight="medium" type="caption" className="status-text">
              {connected ? 'Connected' : 'Not connected'}
            </CWText>
            <div className="status-row">
              <div className={clsx('status-light', { connected })} />
              <CWIdentificationTag address={address} />
            </div>
            {commonWalletAddress && (
              <div className="status-row">
                <CWText>Click to copy Commmon Wallet address</CWText>
              </div>
            )}
          </div>
        )}

        <div className="status-button">
          <CWButton
            {...(connected ? { iconLeft: 'checkCircleFilled' } : {})}
            buttonHeight="sm"
            buttonWidth="full"
            label={connected ? 'Joined' : 'Join community'}
            disabled={connected}
            onClick={handleJoinCommunity}
          />
        </div>
      </div>
      {JoinCommunityModals}
    </>
  );
};

export default AccountConnectionIndicator;
