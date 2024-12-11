import { useFlag } from 'client/scripts/hooks/useFlag';
import React from 'react';
import { useInviteLinkModal } from 'state/ui/modals';
import useUserStore from 'state/ui/user';
import useJoinCommunity from 'views/components/SublayoutHeader/useJoinCommunity';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import { SharePopover } from '../../SharePopover';
import { AddressList } from '../CommunitySection/AddressList';
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

  return (
    <>
      <div className="AccountConnectionIndicator">
        {connected && (
          <div className="status-address">
            <CWText fontWeight="medium" type="caption" className="status-text">
              {connected ? 'Addresses' : 'Not connected'}
            </CWText>
            <div className="status-row">
              <AddressList address={address} addresses={userData.addresses} />
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
