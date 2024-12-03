import { WalletId } from '@hicommonwealth/shared';
import { useFlag } from 'client/scripts/hooks/useFlag';
import { saveToClipboard } from 'client/scripts/utils/clipboard';
import clsx from 'clsx';
import React from 'react';
import { useInviteLinkModal } from 'state/ui/modals';
import useUserStore from 'state/ui/user';
import useJoinCommunity from 'views/components/SublayoutHeader/useJoinCommunity';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import { CWIdentificationTag } from 'views/components/component_kit/new_designs/CWIdentificationTag';
import { handleMouseEnter, handleMouseLeave } from 'views/menus/utils';
import useAuthentication from '../../../modals/AuthModal/useAuthentication';
import { SharePopover } from '../../SharePopover';
import CWIconButton from '../../component_kit/new_designs/CWIconButton';
import { CWTooltip } from '../../component_kit/new_designs/CWTooltip';
import './AccountConnectionIndicator.scss';

interface AccountConnectionIndicatorProps {
  connected: boolean;
  address: string;
}

const AccountConnectionIndicator = ({
  connected,
  address,
}: AccountConnectionIndicatorProps) => {
  const { handleJoinCommunity, JoinCommunityModals } = useJoinCommunity();
  const referralsEnabled = useFlag('referrals');
  const { setIsInviteLinkModalOpen } = useInviteLinkModal();

  const userData = useUserStore();
  const hasMagic = userData.addresses?.[0]?.walletId === WalletId.Magic;

  const { openMagicWallet } = useAuthentication({});

  return (
    <>
      <div className="AccountConnectionIndicator">
        {connected && (
          <div className="status-address">
            <CWText fontWeight="medium" type="caption" className="status-text">
              {connected ? 'Connected' : 'Not connected'}
            </CWText>
            <div className="status-row">
              <div className={clsx('status-light', { connected })} />
              <CWIdentificationTag address={address} />
              <CWTooltip
                placement="top"
                content="address copied!"
                renderTrigger={(handleInteraction, isTooltipOpen) => {
                  return (
                    <CWIconButton
                      iconName="copySimple"
                      onClick={(event) => {
                        saveToClipboard(address).catch(console.error);
                        handleInteraction(event);
                      }}
                      onMouseLeave={(e) => {
                        if (isTooltipOpen) {
                          handleInteraction(e);
                        }
                      }}
                      className="copy-icon"
                    />
                  );
                }}
              />
              {hasMagic && (
                <CWTooltip
                  placement="top"
                  content="Open wallet"
                  renderTrigger={(handleInteraction, isTooltipOpen) => {
                    return (
                      <CWIconButton
                        iconName="arrowSquareOut"
                        onClick={openMagicWallet}
                        onMouseEnter={(e) => {
                          handleMouseEnter({
                            e,
                            isTooltipOpen,
                            handleInteraction,
                          });
                        }}
                        onMouseLeave={(e) => {
                          handleMouseLeave({
                            e,
                            isTooltipOpen,
                            handleInteraction,
                          });
                        }}
                        className="open-wallet-icon"
                      />
                    );
                  }}
                />
              )}
            </div>

            {referralsEnabled && (
              <CWButton
                buttonType="tertiary"
                buttonHeight="sm"
                buttonWidth="full"
                label="Get referral link"
                className="referral-link-button"
                onClick={() => setIsInviteLinkModalOpen(true)}
              />
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
          <SharePopover linkToShare={window.location.href} />
        </div>
      </div>
      {JoinCommunityModals}
    </>
  );
};

export default AccountConnectionIndicator;
