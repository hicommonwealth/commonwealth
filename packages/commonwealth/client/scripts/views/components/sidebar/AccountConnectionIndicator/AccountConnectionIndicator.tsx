import { useFlag } from 'client/scripts/hooks/useFlag';
import AddressInfo from 'client/scripts/models/AddressInfo';
import NewProfile from 'client/scripts/models/NewProfile';
import { AuthModalType } from 'client/scripts/views/modals/AuthModal';
import React from 'react';
import { useInviteLinkModal } from 'state/ui/modals';
import useJoinCommunity from 'views/components/SublayoutHeader/useJoinCommunity';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import { SharePopover } from '../../SharePopover';
import { AddressList } from '../CommunitySection/AddressList';
import './AccountConnectionIndicator.scss';

interface AccountConnectionIndicatorProps {
  connected: boolean;
  address: string;
  addresses: AddressInfo[] | undefined;
  profile: NewProfile | undefined;
  refreshProfiles: () => void;
  onAuthModalOpen: (modalType?: AuthModalType) => void;
}

const AccountConnectionIndicator = ({
  connected,
  address,
  profile,
  addresses,
  refreshProfiles,
  onAuthModalOpen,
}: AccountConnectionIndicatorProps) => {
  const { handleJoinCommunity, JoinCommunityModals } = useJoinCommunity();
  const referralsEnabled = useFlag('referrals');
  const { setIsInviteLinkModalOpen } = useInviteLinkModal();

  if (!profile) {
    return null;
  }

  return (
    <>
      <div className="AccountConnectionIndicator">
        {connected && (
          <div className="status-address">
            <div className="status-row">
              <AddressList
                address={address}
                addresses={addresses}
                profile={profile}
                refreshProfiles={refreshProfiles}
                onAuthModalOpen={() => onAuthModalOpen()}
              />
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
