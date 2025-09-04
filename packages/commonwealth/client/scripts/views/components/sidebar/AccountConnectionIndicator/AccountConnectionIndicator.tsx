import { useFlag } from 'client/scripts/hooks/useFlag';
import AddressInfo from 'client/scripts/models/AddressInfo';
import NewProfile from 'client/scripts/models/NewProfile';
import { AuthModalType } from 'client/scripts/views/modals/AuthModal';
import { DeleteAddressModal } from 'client/scripts/views/modals/delete_address_modal';
import React, { useState } from 'react';
import app from 'state';
import { useInviteLinkModal } from 'state/ui/modals';
import useJoinCommunity from 'views/components/SublayoutHeader/useJoinCommunity';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import { CWModal } from 'views/components/component_kit/new_designs/CWModal';
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
  isInsideCommunity?: boolean;
}

const AccountConnectionIndicator = ({
  connected,
  address,
  profile,
  addresses,
  refreshProfiles,
  onAuthModalOpen,
  isInsideCommunity,
}: AccountConnectionIndicatorProps) => {
  const { handleJoinCommunity, JoinCommunityModals } = useJoinCommunity();
  const referralsEnabled = useFlag('referrals');
  const { setIsInviteLinkModalOpen } = useInviteLinkModal();
  const [isHovering, setIsHovering] = useState(false);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);

  if (!profile) {
    return null;
  }

  // Find the current connected address instead of using addresses[0]
  const currentAddress = addresses?.find((addr) => addr.address === address);

  // Calculate if this is the last address for this community
  const isLastCommunityAddress = addresses ? addresses.length === 1 : false;

  // Get community info from the current address or app state
  const communityId =
    currentAddress?.community?.id || app.activeChainId() || '';
  const communityName = app.chain?.meta?.name || '';

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
                isInsideCommunity={isInsideCommunity}
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
            {...(connected && !isHovering
              ? { iconLeft: 'checkCircleFilled' }
              : {})}
            buttonHeight="sm"
            buttonWidth="full"
            buttonType={connected && isHovering ? 'destructive' : 'primary'}
            buttonAlt={connected && isHovering ? 'rorange' : undefined}
            label={
              connected ? (isHovering ? 'Leave' : 'Joined') : 'Join community'
            }
            onMouseEnter={connected ? () => setIsHovering(true) : undefined}
            onMouseLeave={connected ? () => setIsHovering(false) : undefined}
            onClick={
              connected ? () => setIsLeaveModalOpen(true) : handleJoinCommunity
            }
          />
          <SharePopover
            linkToShare={
              window.location.origin +
              '/' +
              app.activeChainId() +
              '/discussions'
            }
          />
        </div>
      </div>
      {JoinCommunityModals}
      <CWModal
        size="small"
        open={isLeaveModalOpen}
        onClose={() => setIsLeaveModalOpen(false)}
        content={
          currentAddress && addresses ? (
            <DeleteAddressModal
              addresses={addresses}
              address={currentAddress}
              chain={communityId}
              closeModal={() => setIsLeaveModalOpen(false)}
              communityName={communityName}
              isBulkDelete={false}
              isLastCommunityAddress={isLastCommunityAddress}
            />
          ) : null
        }
      />
    </>
  );
};

export default AccountConnectionIndicator;
